import http from "node:http";
import type { AddressInfo } from "node:net";

// SIMULACIÓN de la API de Anthropic (Messages), SOLO PARA PRUEBAS: el SDK oficial apunta aquí con baseURL.
// Sirve para probar el planificador (validación, errores, registro de uso); no demuestra la integración real.

export type FakeAnthropicReply = { kind: "plan"; plan: unknown } | { kind: "status"; status: number; type: string; message: string } | { kind: "refusal" };

export const startFakeAnthropic = async (script: FakeAnthropicReply[]) => {
  const requests: { headers: http.IncomingHttpHeaders; body: Record<string, unknown> }[] = [];
  const server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    requests.push({ headers: req.headers, body });
    const r = script.shift() ?? { kind: "status", status: 500, type: "api_error", message: "sin respuesta preparada" };
    if (r.kind === "status") {
      res.writeHead(r.status, { "Content-Type": "application/json" });
      return void res.end(JSON.stringify({ type: "error", error: { type: r.type, message: r.message } }));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        id: "msg_simulado",
        type: "message",
        role: "assistant",
        model: body.model,
        content: r.kind === "plan" ? [{ type: "text", text: JSON.stringify(r.plan) }] : [],
        stop_reason: r.kind === "plan" ? "end_turn" : "refusal",
        stop_sequence: null,
        usage: { input_tokens: 1200, output_tokens: 300 },
      }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    requests,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
};
