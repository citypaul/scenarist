import { http, passthrough } from "msw";
import { setupServer, type SetupServer } from "msw/node";
import {
  createDynamicRequestResolver,
  type DynamicHandlerOptions,
  type DynamicRequestResolution,
  type DynamicRequestResolver,
} from "../handlers/dynamic-handler.js";

type Registration = {
  readonly id: symbol;
  readonly resolveRequest: DynamicRequestResolver;
};

type SharedServerSnapshot = {
  readonly registrations: ReadonlyArray<Registration>;
  readonly listening: boolean;
};

type SharedServerState = {
  readonly server: SetupServer;
  readonly snapshot: { value: SharedServerSnapshot };
};

export type SharedMswServer = {
  readonly listen: () => void;
  readonly close: () => void;
};

const resolveRequest = async (
  registrations: ReadonlyArray<Registration>,
  request: Request,
): Promise<DynamicRequestResolution> => {
  const [registration, ...remainingRegistrations] = registrations;

  if (!registration) {
    return { type: "unmatched", strictMode: false };
  }

  const resolution = await registration.resolveRequest(request);

  if (resolution.type === "handled") {
    return resolution;
  }

  const remainingResolution = await resolveRequest(
    remainingRegistrations,
    request,
  );

  if (remainingResolution.type === "handled") {
    return remainingResolution;
  }

  return {
    type: "unmatched",
    strictMode: resolution.strictMode || remainingResolution.strictMode,
  };
};

const createSharedServerState = (): SharedServerState => {
  const snapshot = {
    value: {
      registrations: [],
      listening: false,
    } satisfies SharedServerSnapshot,
  };
  const server = setupServer(
    http.all("*", async ({ request }) => {
      const resolution = await resolveRequest(
        snapshot.value.registrations,
        request,
      );

      if (resolution.type === "handled") {
        return resolution.response;
      }

      if (resolution.strictMode) {
        return new Response(null, { status: 501 });
      }

      return passthrough();
    }),
  );

  return { server, snapshot };
};

declare global {
  var __scenarist_shared_msw_server: SharedServerState | undefined;
}

globalThis.__scenarist_shared_msw_server ??= createSharedServerState();

const sharedState = globalThis.__scenarist_shared_msw_server;

export const createSharedMswServer = (
  options: DynamicHandlerOptions,
): SharedMswServer => {
  const registration = {
    id: Symbol(),
    resolveRequest: createDynamicRequestResolver(options),
  };

  return {
    listen: () => {
      if (
        sharedState.snapshot.value.registrations.some(
          ({ id }) => id === registration.id,
        )
      ) {
        return;
      }

      const registrations = [
        registration,
        ...sharedState.snapshot.value.registrations,
      ];

      if (!sharedState.snapshot.value.listening) {
        sharedState.server.listen();
      }

      sharedState.snapshot.value = {
        registrations,
        listening: true,
      };
    },
    close: () => {
      const registrations = sharedState.snapshot.value.registrations.filter(
        ({ id }) => id !== registration.id,
      );

      if (
        registrations.length ===
        sharedState.snapshot.value.registrations.length
      ) {
        return;
      }

      if (registrations.length === 0) {
        sharedState.server.close();
      }

      sharedState.snapshot.value = {
        registrations,
        listening: registrations.length > 0,
      };
    },
  };
};
