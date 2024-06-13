import { exec } from "child_process";
import { stdin, stdout } from "process";

function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

if (process.argv[2] == "supports") {
  process.exit(0);
}

exec("npm run build", async (error, out, err) => {
  if (error) process.exit(1);

  let input = await streamToString(stdin);

  const [_, book] = JSON.parse(input);
  console.log(JSON.stringify(book));
});
