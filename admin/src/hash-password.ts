// Génère le hash bcrypt du mot de passe admin (à mettre dans ADMIN_PASSWORD_HASH).
// Usage : npm run hash-password   (le mot de passe est demandé, sans écho terminal)
import bcrypt from "bcryptjs";
import process, { stdin, stdout } from "node:process";

const CTRL_C = String.fromCharCode(3);
const CTRL_D = String.fromCharCode(4);
const BACKSPACE = String.fromCharCode(127);

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    stdout.write(question);
    const chars: string[] = [];
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (ch: string) => {
      if (ch === "\r" || ch === "\n" || ch === CTRL_D) {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.off("data", onData);
        stdout.write("\n");
        resolve(chars.join(""));
      } else if (ch === CTRL_C) {
        stdout.write("\n");
        process.exit(1);
      } else if (ch === BACKSPACE || ch === "\b") {
        chars.pop();
      } else {
        chars.push(ch);
      }
    };
    stdin.on("data", onData);
  });
}

const password = await askHidden("Mot de passe admin : ");
if (password.length < 8) {
  console.error("✗ 8 caractères minimum.");
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
console.log("\nADMIN_PASSWORD_HASH à mettre dans infra/.env :\n");
// $ doublés pour docker compose (sinon il interpole ${...} dans le .env)
console.log(hash.replaceAll("$", "$$$$"));
console.log("\n(les $ sont doublés exprès pour docker compose ; coller tel quel)");
