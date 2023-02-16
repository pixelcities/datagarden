export enum ExecutionError {
  Retry = 0,
  Failure = 1,
  Integrity = 2,
}

export enum DataType {
  String = "String",
  RelativeNumber = "RelativeNumber",
  AbsoluteNumber = "AbsoluteNumber",
  Other = "Other",
}

export const SqlTypeMap: {[key: string]: string} = {
  String: "VARCHAR",
  RelativeNumber: "FLOAT",
  AbsoluteNumber: "INT", // TODO: Have both int / float variant
  Other: "VARCHAR"
}

export enum Function1 {
  abs = "abs",
  length = "length",
  lower = "lower",
  ltrim = "ltrim",
  round = "round",
  rtrim = "rtrim",
  sqrt = "sqrt",
  trim = "trim",
  upper = "upper"
}
