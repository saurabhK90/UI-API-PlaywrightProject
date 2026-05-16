import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';

/**
 * File reading utilities. No Playwright imports.
 */
export class FileUtils {
  static readJSON<T = unknown>(filePath: string): T {
    const resolved = path.resolve(filePath);
    const content = fs.readFileSync(resolved, 'utf-8');
    return JSON.parse(content) as T;
  }

  static writeJSON(filePath: string, data: unknown): void {
    const resolved = path.resolve(filePath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, JSON.stringify(data, null, 2), 'utf-8');
  }

  static readText(filePath: string): string {
    return fs.readFileSync(path.resolve(filePath), 'utf-8');
  }

  static fileExists(filePath: string): boolean {
    return fs.existsSync(path.resolve(filePath));
  }

  static ensureDir(dirPath: string): void {
    fs.mkdirSync(path.resolve(dirPath), { recursive: true });
  }

  static deleteFile(filePath: string): void {
    const resolved = path.resolve(filePath);
    if (fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
  }

  static readCSV(filePath: string): Record<string, string>[] {
    const content = fs.readFileSync(path.resolve(filePath), 'utf-8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return headers.reduce<Record<string, string>>((row, header, idx) => {
        row[header] = values[idx] ?? '';
        return row;
      }, {});
    });
  }

  static async readExcel(filePath: string, sheetName?: string): Promise<Record<string, unknown>[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.resolve(filePath));

    const sheet = sheetName
      ? workbook.getWorksheet(sheetName)
      : workbook.worksheets[0];

    if (!sheet) throw new Error(`Sheet "${sheetName ?? 'first'}" not found in ${filePath}`);

    const rows: Record<string, unknown>[] = [];
    const headers: string[] = [];

    sheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) {
        row.eachCell(cell => headers.push(String(cell.value ?? '')));
        return;
      }

      const record: Record<string, unknown> = {};
      row.eachCell((cell, colIndex) => {
        record[headers[colIndex - 1]] = cell.value;
      });
      rows.push(record);
    });

    return rows;
  }
}
