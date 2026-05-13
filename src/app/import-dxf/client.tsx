"use client";
import { useActionState } from "react";
import { type ImportState, importDxfAction } from "./actions";

const initialState: ImportState = { status: "idle" };

export function ImportDxfForm() {
  const [state, formAction, isPending] = useActionState(
    importDxfAction,
    initialState,
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Importar DXF — Sancad</h1>

      <form action={formAction} className="mb-8 space-y-4 max-w-lg">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nome do Projeto
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="border rounded px-3 py-2 w-full"
            placeholder="Ex: COLETOR 01"
          />
        </div>

        <div>
          <label htmlFor="dxf" className="block text-sm font-medium mb-1">
            Arquivo DXF
          </label>
          <input
            id="dxf"
            name="dxf"
            type="file"
            accept=".dxf"
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Importando…" : "Importar"}
        </button>
      </form>

      {state.status === "error" && (
        <p className="text-red-600 mb-6 font-medium">{state.error}</p>
      )}

      {state.status === "success" && (
        <div>
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-semibold">
              Projeto criado: {state.project.name}
            </p>
            <p className="text-sm text-gray-600">ID: {state.project.id}</p>
          </div>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-2">
              Trechos ({state.segments.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Código</th>
                    <th className="border px-2 py-1 text-left">PV Mon</th>
                    <th className="border px-2 py-1 text-left">PV Jus</th>
                    <th className="border px-2 py-1 text-right">GI Mon (m)</th>
                    <th className="border px-2 py-1 text-right">GI Jus (m)</th>
                    <th className="border px-2 py-1 text-right">Comp (m)</th>
                    <th className="border px-2 py-1 text-right">Decliv (%)</th>
                    <th className="border px-2 py-1 text-left">Pavimento</th>
                  </tr>
                </thead>
                <tbody>
                  {state.segments.map((s) => {
                    const upNode = state.nodes.find(
                      (n) => n.id === s.upstreamNodeId,
                    );
                    const downNode = state.nodes.find(
                      (n) => n.id === s.downstreamNodeId,
                    );
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="border px-2 py-1">{s.code}</td>
                        <td className="border px-2 py-1">{upNode?.code}</td>
                        <td className="border px-2 py-1">{downNode?.code}</td>
                        <td className="border px-2 py-1 text-right">
                          {s.upstreamInvert.toFixed(3)}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {s.downstreamInvert.toFixed(3)}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {s.length.toFixed(2)}
                        </td>
                        <td className="border px-2 py-1 text-right">
                          {(s.slope * 100).toFixed(4)}
                        </td>
                        <td className="border px-2 py-1">
                          {s.pavementType ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              Nós Hidráulicos ({state.nodes.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Código</th>
                    <th className="border px-2 py-1 text-right">X (UTM)</th>
                    <th className="border px-2 py-1 text-right">Y (UTM)</th>
                    <th className="border px-2 py-1 text-right">GI (m)</th>
                    <th className="border px-2 py-1 text-right">Ângulo (°)</th>
                  </tr>
                </thead>
                <tbody>
                  {state.nodes.map((n) => (
                    <tr key={n.id} className="hover:bg-gray-50">
                      <td className="border px-2 py-1">{n.code}</td>
                      <td className="border px-2 py-1 text-right">
                        {n.x.toFixed(3)}
                      </td>
                      <td className="border px-2 py-1 text-right">
                        {n.y.toFixed(3)}
                      </td>
                      <td className="border px-2 py-1 text-right">
                        {n.invertElevation.toFixed(3)}
                      </td>
                      <td className="border px-2 py-1 text-right">
                        {n.angle?.toFixed(2) ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
