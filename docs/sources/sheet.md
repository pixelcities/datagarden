# Spreadsheet

Upload any of the major workbook formats (.xls, .xlsx, .ods).

## Notes
- Because DataGarden does not work with formulas, any existing formulas are discarded: only the data is uploaded.
- If there are multiple sheets in the workbook, only the first one is parsed.
- It is assumed that the data starts at A1, and that the first row contains the header (column names). No additional
    data (e.g. comments) should be present.
