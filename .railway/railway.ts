import {
  bucket,
  defineRailway,
  postgres,
  preserve,
  project,
  service,
  volume,
} from "railway/iac";

export default defineRailway(() => {
  const Postgres = postgres("Postgres", { region: "us-east4-eqdc4a" });
  Postgres.networking = {
    privateNetworkEndpoint: "postgres",
    tcpProxies: { "5432": {} },
  };
  const postgresVolume = volume("postgres-volume", {
    alerts: { usage: { "100": {}, "80": {}, "95": {} } },
    allowOnlineResize: true,
    region: "us-east4-eqdc4a",
    sizeMB: 5000,
  });
  const touchGrass = bucket("touch-grass", { region: "iad" });
  const api = service("api", {
    build: {
      buildEnvironment: "V3",
      builder: "DOCKERFILE",
      dockerfilePath: "Dockerfile",
      watchPatterns: [
        "/apps/server/**",
        "/packages/**",
        "/bun.lock",
        "/package.json",
        "/Dockerfile",
        "/.dockerignore",
        "/.railway/**",
      ],
    },
    healthcheck: "/healthz",
    healthcheckTimeout: 120,
    preDeploy: "bun run --cwd packages/db db:migrate",
    replicas: { "us-east4-eqdc4a": 1 },
    deploy: { restartPolicyMaxRetries: 3 },
    env: {
      BETTER_AUTH_SECRET: preserve(),
      BETTER_AUTH_URL: preserve(),
      CORS_ORIGIN: preserve(),
      DATABASE_URL: preserve(),
      GEMINI_API_KEY: preserve(),
      NODE_ENV: preserve(),
      PORT: preserve(),
      S3_URL: preserve(),
      VAPID_KEYS: preserve(),
    },
  });

  return project("touch-grass", {
    resources: [api, Postgres, postgresVolume, touchGrass],
  });
});
