"use strict";

/// Created by: Erlang Parasu 2023.

import { fnTryParseUseImportVer8 } from "../use_import_parser_v8";
import { kImportLines } from "./data/sample_use_import_for_test";

fnTryParseUseImportVer8(kImportLines.join("\n"));
