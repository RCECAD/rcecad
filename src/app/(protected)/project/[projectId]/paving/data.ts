export const pavingTypes = ["Asfalto", "Paralelepípedo", "Cascalho"] as const;
export const surfaceConditions = ["Boa", "Regular", "Péssima"] as const;

export type PavingSegment = {
  id: string;
  segment: string;
  pavingType: (typeof pavingTypes)[number] | "";
  surfaceCondition: (typeof surfaceConditions)[number] | "";
  notes: string;
};

export const pavingMockData: PavingSegment[] = [
  {
    id: "1",
    segment: "T-01",
    pavingType: "Asfalto",
    surfaceCondition: "Boa",
    notes: "",
  },
  {
    id: "2",
    segment: "T-02",
    pavingType: "Paralelepípedo",
    surfaceCondition: "Regular",
    notes: "",
  },
  {
    id: "3",
    segment: "T-03",
    pavingType: "Cascalho",
    surfaceCondition: "Péssima",
    notes: "",
  },
  { id: "4", segment: "T-04", pavingType: "", surfaceCondition: "", notes: "" },
  { id: "5", segment: "T-05", pavingType: "", surfaceCondition: "", notes: "" },
];
