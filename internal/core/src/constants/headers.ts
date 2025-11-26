/**
 * The standard header name used for test ID isolation.
 *
 * This header is used by Scenarist to identify which test a request belongs to,
 * enabling concurrent tests with different backend states.
 *
 * This is a fixed constant - not configurable by users.
 */
export const SCENARIST_TEST_ID_HEADER = 'x-scenarist-test-id';
