const { spawn } = require("child_process");

const env = {
  ...process.env,
  JAVA_HOME: "D:\\Android\\jdk-17",
  ANDROID_HOME: "D:\\Android\\Sdk",
  PATH: `D:\\Android\\jdk-17\\bin;D:\\Android\\Sdk\\platform-tools;D:\\Android\\Sdk\\cmdline-tools\\latest\\bin;${process.env.PATH || ""}`,
};

const child = spawn("npx", ["react-native", "start", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env,
});

child.on("exit", (code) => {
  process.exit(code || 0);
});

