const { spawn } = require("child_process");
const path = require("path");

const env = {
  ...process.env,
  JAVA_HOME: "D:\\Android\\jdk-17",
  ANDROID_HOME: "D:\\Android\\Sdk",
  PATH: `D:\\Android\\jdk-17\\bin;D:\\Android\\Sdk\\platform-tools;D:\\Android\\Sdk\\cmdline-tools\\latest\\bin;${process.env.PATH || ""}`,
};

console.log("Starting Android build with SDK and JDK from D: drive...");
const child = spawn("npx", ["react-native", "run-android", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env,
});

child.on("exit", (code) => {
  process.exit(code || 0);
});

