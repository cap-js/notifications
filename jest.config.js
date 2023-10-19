// FIXME: should not be necessary
process.env.CDS_ENV = "better-sqlite";

const config = {
  testTimeout: 42222,
  testMatch: ["**/*.test.js"],
  verbose: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    }
  }
};

module.exports = config;
