import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { DateTime } from 'luxon';

export interface ExportFilterEntry {
  label: string;
  value: string;
  isSection?: boolean;
}

export interface ExportMetadata {
  title: string;
  /** Optional scoping label shown in the info sheet (e.g. tenant/org name). */
  contextName?: string;
  filters?: ExportFilterEntry[];
  totalRecords: number;
  exportedAt?: Date;
}

export interface ColDef {
  header: string;
  key: string;
  width?: number;
  numFmt?: string;
}

export interface SheetConfig {
  name: string;
  columns: ColDef[];
  rows: unknown[][];
}

export interface ExportConfig {
  metadata: ExportMetadata;
  sheets: SheetConfig[];
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF3F4F6' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, size: 10 };

const ALT_ROW_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFAFAFA' },
};

const META_LABEL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF3F4F6' },
};

const META_SECTION_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE5E7EB' },
};

@Injectable()
export class ExcelExportService {
  async buildBuffer(config: ExportConfig): Promise<Buffer<ArrayBufferLike>> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'App';
    wb.created = config.metadata.exportedAt ?? new Date();

    this.addInfoSheet(wb, config.metadata);

    for (const sheet of config.sheets) {
      this.addDataSheet(wb, sheet);
    }

    const raw = await wb.xlsx.writeBuffer();
    return Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  }

  private addInfoSheet(wb: ExcelJS.Workbook, meta: ExportMetadata): void {
    const ws = wb.addWorksheet('Información');
    ws.views = [{ showGridLines: false }];
    ws.columns = [
      { key: 'label', width: 24 },
      { key: 'value', width: 40 },
    ];

    const entries: ExportFilterEntry[] = [
      { label: 'Reporte', value: meta.title },
      ...(meta.contextName
        ? [{ label: 'Contexto', value: meta.contextName }]
        : []),
      {
        label: 'Exportado el',
        value: DateTime.fromJSDate(meta.exportedAt ?? new Date())
          .setLocale('es')
          .toFormat('dd/MM/yyyy HH:mm'),
      },
      ...(meta.filters ?? []),
      { label: 'Total de registros', value: String(meta.totalRecords) },
    ];

    for (const entry of entries) {
      if (entry.isSection) {
        const row = ws.addRow([entry.label]);
        ws.mergeCells(row.number, 1, row.number, 2);
        row.getCell(1).fill = META_SECTION_FILL;
        row.getCell(1).font = {
          bold: true,
          size: 9,
          color: { argb: 'FF6B7280' },
        };
        row.getCell(1).alignment = { vertical: 'middle' };
        row.height = 18;
      } else {
        const row = ws.addRow([entry.label, entry.value]);
        row.getCell(1).fill = META_LABEL_FILL;
        row.getCell(1).font = {
          bold: true,
          size: 10,
          color: { argb: 'FF6B7280' },
        };
        row.getCell(2).font = { size: 10 };
        row.height = 20;
      }
    }
  }

  private addDataSheet(wb: ExcelJS.Workbook, config: SheetConfig): void {
    const ws = wb.addWorksheet(config.name);
    ws.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }];

    ws.columns = config.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width ?? this.estimateWidth(col.header),
    }));

    // Style header row
    const headerRow = ws.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
    });
    headerRow.height = 22;

    // Add data rows
    config.rows.forEach((rowData, idx) => {
      const row = ws.addRow(rowData);
      if (idx % 2 === 1) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = ALT_ROW_FILL;
        });
      }
      row.height = 18;

      // Apply numFmt per column
      config.columns.forEach((col, colIdx) => {
        if (col.numFmt) {
          row.getCell(colIdx + 1).numFmt = col.numFmt;
        }
      });
    });

    // Auto-fit columns based on content
    this.autoFitColumns(ws, config);
  }

  private autoFitColumns(ws: ExcelJS.Worksheet, config: SheetConfig): void {
    config.columns.forEach((colDef, idx) => {
      if (colDef.width) return;
      const col = ws.getColumn(idx + 1);
      let maxLen = colDef.header.length;
      col.eachCell({ includeEmpty: false }, (cell) => {
        const val = cell.value;
        if (val != null) {
          const len = String(val).length;
          if (len > maxLen) maxLen = len;
        }
      });
      col.width = Math.min(Math.max(maxLen * 1.15, 10), 60);
    });
  }

  private estimateWidth(header: string): number {
    return Math.min(Math.max(header.length * 1.3, 12), 40);
  }

  buildFilename(prefix: string, from?: Date | null, to?: Date | null): string {
    const parts = [
      prefix,
      from ? DateTime.fromJSDate(from).toFormat('yyyy-MM-dd') : null,
      to ? DateTime.fromJSDate(to).toFormat('yyyy-MM-dd') : null,
    ].filter(Boolean);
    return `${parts.join('_')}.xlsx`;
  }
}
