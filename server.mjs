import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Pasta gerada pelo `npm run build`
const distPath = path.join(__dirname, "dist");

// Servir arquivos estáticos (JS, CSS, imagens, etc.)
app.use(express.static(distPath));

// SPA: qualquer rota volta para o index.html (client-side routing)
app.get("*", (req, res) => {
  const indexPath = path.join(distPath, "index.html");
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Erro ao servir index.html:", err);
      res.status(500).send("Erro ao carregar aplicação");
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📁 Servindo arquivos de: ${distPath}`);
});
