export enum ExecutionError {
  Retry = 0,
  Failure = 1,
}

export enum DataType {
  String = "String",
  RelativeNumber = "RelativeNumber",
  AbsoluteNumber = "AbsoluteNumber",
  Other = "Other",
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
