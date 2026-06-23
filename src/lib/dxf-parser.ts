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

type Group = [number, string];

/**
 * Cursor that walks raw DXF text yielding (code, value) pairs on demand.
 * Avoids building an intermediate array of all groups — keeps memory flat
 * for large DXFs and supports lookahead via peek().
 */
class DxfGroupCursor {
  private readonly rawLines: string[];
  private pos = 0;
  private buffered: Group | null = null;

  constructor(content: string) {
    this.rawLines = content.split(/\r?\n/);
  }

  peek(): Group | null {
    if (this.buffered === null) {
      this.buffered = this.readNext();
    }
    return this.buffered;
  }

  consume(): Group | null {
    if (this.buffered !== null) {
      const group = this.buffered;
      this.buffered = null;
      return group;
    }
    return this.readNext();
  }

  private readNext(): Group | null {
    while (this.pos < this.rawLines.length - 1) {
      const code = Number.parseInt(this.rawLines[this.pos].trim(), 10);
      const value = this.rawLines[this.pos + 1].trim();
      this.pos += 2;
      if (!Number.isNaN(code)) return [code, value];
    }
    return null;
  }
}

function parseLineBody(cursor: DxfGroupCursor): DxfLine {
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
  let currentApp = "";

  while (true) {
    const group = cursor.peek();
    if (group === null || group[0] === 0) break;
    cursor.consume();
    const code = group[0];
    const value = group[1];

    switch (code) {
      case 8:
        line.layer = value;
        break;
      case 10:
        line.x0 = Number.parseFloat(value);
        break;
      case 20:
        line.y0 = Number.parseFloat(value);
        break;
      case 30:
        line.z0 = Number.parseFloat(value);
        break;
      case 11:
        line.x1 = Number.parseFloat(value);
        break;
      case 21:
        line.y1 = Number.parseFloat(value);
        break;
      case 31:
        line.z1 = Number.parseFloat(value);
        break;
      case 1001:
        currentApp = value;
        line.xdata[value] ??= [];
        break;
      case 1000:
        if (currentApp) line.xdata[currentApp].push(value);
        break;
    }
  }

  return line;
}

function parseInsertBody(cursor: DxfGroupCursor): DxfInsert {
  const insert: DxfInsert = {
    layer: "",
    block: "",
    x: 0,
    y: 0,
    z: 0,
    angle: 0,
  };

  while (true) {
    const group = cursor.peek();
    if (group === null || group[0] === 0) break;
    cursor.consume();
    const code = group[0];
    const value = group[1];

    switch (code) {
      case 8:
        insert.layer = value;
        break;
      case 2:
        insert.block = value;
        break;
      case 10:
        insert.x = Number.parseFloat(value);
        break;
      case 20:
        insert.y = Number.parseFloat(value);
        break;
      case 30:
        insert.z = Number.parseFloat(value);
        break;
      case 50:
        insert.angle = Number.parseFloat(value);
        break;
    }
  }

  return insert;
}

export function parseDxf(content: string): DxfParseResult {
  const cursor = new DxfGroupCursor(content);
  const lines: DxfLine[] = [];
  const inserts: DxfInsert[] = [];

  let inEntities = false;

  while (true) {
    const group = cursor.consume();
    if (group === null) break;
    const code = group[0];
    const value = group[1];

    if (code === 0 && value === "SECTION") {
      const sectionHeader = cursor.consume();
      inEntities = sectionHeader !== null && sectionHeader[1] === "ENTITIES";
      continue;
    }

    if (code === 0 && value === "ENDSEC") {
      inEntities = false;
      continue;
    }

    if (!inEntities) continue;

    if (code === 0 && value === "LINE") {
      lines.push(parseLineBody(cursor));
      continue;
    }

    if (code === 0 && value === "INSERT") {
      inserts.push(parseInsertBody(cursor));
    }
  }

  return { lines, inserts };
}
