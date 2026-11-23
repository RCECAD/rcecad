export const NETWORK_MATERIALS = [
  "PVC JEI",
  "PVC",
  "Concreto",
  "Ferro fundido",
  "PEAD",
  "Cerâmico",
];

// Keeps a material saved as free text before the select existed selectable.
export function networkMaterialOptions(current: string | null | undefined) {
  return current && !NETWORK_MATERIALS.includes(current)
    ? [current, ...NETWORK_MATERIALS]
    : NETWORK_MATERIALS;
}
