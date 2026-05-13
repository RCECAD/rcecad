export type DxfLine = {
  layer: string;
  x0: number;
  y0: number;
  z0: number;
  x1: number;
  y1: number;
  z1: number;
  xdata: Record<string, string[]>;
};

export type DxfInsert = {
  layer: string;
  block: string;
  x: number;
  y: number;
  z: number;
  angle: number;
};

export type DxfParseResult = {
  lines: DxfLine[];
  inserts: DxfInsert[];
};

function parseGroups(content: string): [number, string][] {
  const rawLines = content.split(/\r?\n/);
  const groups: [number, string][] = [];
  for (let i = 0; i < rawLines.length - 1; i += 2) {
    const code = Number.parseInt(rawLines[i].trim(), 10);
    const value = rawLines[i + 1].trim();
    if (!Number.isNaN(code)) {
      groups.push([code, value]);
    }
  }
  return groups;
}

export function parseDxf(content: string): DxfParseResult {
  const groups = parseGroups(content);
  const lines: DxfLine[] = [];
  const inserts: DxfInsert[] = [];

  let inEntities = false;
  let i = 0;

  while (i < groups.length) {
    const [code, value] = groups[i];

    if (code === 0 && value === "SECTION") {
      i++;
      const [, sectionName] = groups[i];
      inEntities = sectionName === "ENTITIES";
      i++;
      continue;
    }

    if (code === 0 && value === "ENDSEC") {
      inEntities = false;
      i++;
      continue;
    }

    if (!inEntities) {
      i++;
      continue;
    }

    if (code === 0 && value === "LINE") {
      const line: DxfLine = {
        layer: "",
        x0: 0,
        y0: 0,
        z0: 0,
        x1: 0,
        y1: 0,
        z1: 0,
        xdata: {},
      };
      i++;
      let currentApp = "";
      while (i < groups.length && groups[i][0] !== 0) {
        const [c, v] = groups[i];
        if (c === 8) line.layer = v;
        else if (c === 10) line.x0 = Number.parseFloat(v);
        else if (c === 20) line.y0 = Number.parseFloat(v);
        else if (c === 30) line.z0 = Number.parseFloat(v);
        else if (c === 11) line.x1 = Number.parseFloat(v);
        else if (c === 21) line.y1 = Number.parseFloat(v);
        else if (c === 31) line.z1 = Number.parseFloat(v);
        else if (c === 1001) {
          currentApp = v;
          line.xdata[v] = [];
        } else if (c === 1000 && currentApp) {
          line.xdata[currentApp].push(v);
        }
        i++;
      }
      lines.push(line);
      continue;
    }

    if (code === 0 && value === "INSERT") {
      const insert: DxfInsert = {
        layer: "",
        block: "",
        x: 0,
        y: 0,
        z: 0,
        angle: 0,
      };
      i++;
      while (i < groups.length && groups[i][0] !== 0) {
        const [c, v] = groups[i];
        if (c === 8) insert.layer = v;
        else if (c === 2) insert.block = v;
        else if (c === 10) insert.x = Number.parseFloat(v);
        else if (c === 20) insert.y = Number.parseFloat(v);
        else if (c === 30) insert.z = Number.parseFloat(v);
        else if (c === 50) insert.angle = Number.parseFloat(v);
        i++;
      }
      inserts.push(insert);
      continue;
    }

    i++;
  }

  return { lines, inserts };
}
