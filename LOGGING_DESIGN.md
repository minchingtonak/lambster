# Lambster Logging System Design

## Table of Contents

1. [Current System Analysis](#current-system-analysis)
2. [Logging System Design](#logging-system-design)
3. [Implementation Roadmap](#implementation-roadmap)
4. [Technical Specifications](#technical-specifications)
5. [Usage Examples](#usage-examples)
6. [Performance Considerations](#performance-considerations)
7. [Testing Strategy](#testing-strategy)

---

## Current System Analysis

### Architectural Overview

The Lambster library is a comprehensive lambda calculus parser and evaluator built with TypeScript, featuring:

- **Tagged Union AST**: Clean, type-safe representation using discriminated unions
- **Pattern Matching**: Extensive use of `ts-pattern` for safe AST manipulation
- **Modular Architecture**: Well-separated concerns across parser, types, and utilities
- **Multiple Evaluation Strategies**: Normal order, applicative order, and lazy evaluation

### AST Structure and Types

The core AST is defined in [`src/types/ast.ts`](src/types/ast.ts) with three main types:

```typescript
// Core lambda calculus terms
export type Term =
  | { tag: "var"; name: string }
  | { tag: "abs"; symbol: LambdaSymbol; parameter: string; body: Term }
  | { tag: "app"; function: Term; argument: Term };

// REPL commands
export type Command =
  | { tag: "help" }
  | { tag: "env" }
  | { tag: "unbind"; identifier: string };

// Top-level statements
export type Statement =
  | { tag: "bind"; identifier: string; term: Term }
  | { tag: "cmd"; command: Command }
  | { tag: "term"; term: Term };
```

### Current Evaluation System

The evaluation system in [`src/utils/manipulation.ts`](src/utils/manipulation.ts) provides:

- **Beta-reduction**: Single-step and normalization functions
- **Alpha-conversion**: Variable renaming with capture avoidance
- **Eta-reduction**: Function simplification
- **Multiple strategies**: Normal order, applicative order, lazy evaluation
- **Comprehensive evaluation**: Combined beta/eta reduction with metadata

### Existing Debugging Features

Current debugging capabilities are limited:

- **Basic evaluation**: [`evaluateTerm()`](src/utils/pattern.ts:11) converts terms to strings
- **Pretty printing**: [`prettyPrintTerm()`](src/utils/pattern.ts:30) with parenthesization
- **Complexity analysis**: [`analyzeComplexity()`](src/utils/pattern.ts:56) counts AST nodes
- **Variable analysis**: Free/bound variable detection
- **Normal form checking**: [`isNormalForm()`](src/utils/pattern.ts:131)

### Limitations

The current system lacks:

1. **Step-by-step evaluation tracking**
2. **Visual highlighting of reduction sites**
3. **Rule identification for each step**
4. **Multiple output formats**
5. **Interactive debugging capabilities**
6. **Performance profiling during evaluation**

---

## Logging System Design

### Core Logging Features

#### 1. Step-by-Step Tracking

```
┌─────────────────────────────────────────────────────────────┐
│                    Evaluation Logger                        │
├─────────────────────────────────────────────────────────────┤
│ • Captures each reduction step                              │
│ • Records rule applied (β-reduction, α-conversion, etc.)    │
│ • Tracks term transformations                               │
│ • Measures step timing and complexity                       │
│ • Maintains evaluation context                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Rule Identification

Each evaluation step will be tagged with:

- **Beta-reduction**: `(λx.M) N → M[x := N]`
- **Alpha-conversion**: `λx.M → λy.M[x := y]`
- **Eta-reduction**: `λx.M x → M` (when x ∉ FV(M))
- **Substitution**: Variable replacement operations
- **Structural**: Traversal into sub-terms

#### 3. Visual Highlighting

```
Original:  (λx.x y) (λz.z)
           ^^^^^^^^^^^^     ← Beta-redex highlighted
Step 1:    (x y)[x := λz.z]
           ^^^^^^^^^        ← Substitution highlighted
Result:    (λz.z) y
```

#### 4. Multi-Format Output System

```
┌─────────────────┬─────────────────────────────────────────┐
│ Format          │ Use Case                                │
├─────────────────┼─────────────────────────────────────────┤
│ Console         │ Interactive REPL debugging              │
│ HTML            │ Web-based visualization                 │
│ JSON            │ Programmatic analysis                   │
│ Plain Text      │ Documentation and reports               │
│ LaTeX           │ Academic papers and presentations       │
└─────────────────┴─────────────────────────────────────────┘
```

### Advanced Configuration Options

```typescript
interface LoggingConfig {
  // Output control
  format: "console" | "html" | "json" | "text" | "latex";
  verbosity: "minimal" | "standard" | "detailed" | "debug";

  // Step filtering
  includeSteps: StepType[];
  excludeSteps: StepType[];
  maxSteps: number;

  // Visual options
  highlightRedexes: boolean;
  showSubstitutions: boolean;
  colorizeOutput: boolean;

  // Performance tracking
  measureTiming: boolean;
  trackMemory: boolean;

  // Interactive features
  pauseOnStep: boolean;
  allowStepBack: boolean;
}
```

### New Type Definitions

```typescript
// Evaluation step information
interface EvaluationStep {
  stepNumber: number;
  rule: ReductionRule;
  before: Term;
  after: Term;
  redexLocation: TermPath;
  substitutions?: Substitution[];
  timing?: StepTiming;
  metadata: StepMetadata;
}

// Reduction rule types
type ReductionRule =
  | { type: "beta"; redex: BetaRedex }
  | { type: "alpha"; conversion: AlphaConversion }
  | { type: "eta"; reduction: EtaReduction }
  | { type: "structural"; operation: StructuralOp };

// Path to term location in AST
type TermPath = Array<"function" | "argument" | "body">;

// Substitution record
interface Substitution {
  variable: string;
  replacement: Term;
  locations: TermPath[];
}
```

### Architecture Diagrams

```
┌─────────────────────────────────────────────────────────────┐
│                    Logging Architecture                     │
└─────────────────────────────────────────────────────────────┘

    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │   Parser    │───▶│ Evaluator   │───▶│   Logger    │
    └─────────────┘    └─────────────┘    └─────────────┘
                              │                   │
                              ▼                   ▼
                       ┌─────────────┐    ┌─────────────┐
                       │ Step Tracker│    │  Formatter  │
                       └─────────────┘    └─────────────┘
                              │                   │
                              ▼                   ▼
                       ┌─────────────┐    ┌─────────────┐
                       │Rule Detector│    │   Output    │
                       └─────────────┘    └─────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Data Flow Diagram                        │
└─────────────────────────────────────────────────────────────┘

Term Input
    │
    ▼
┌─────────────┐
│ Evaluation  │──┐
│   Engine    │  │
└─────────────┘  │
    │            │
    ▼            │
┌─────────────┐  │  ┌─────────────┐
│Step Capture │  │  │   Config    │
│   System    │◀─┘  │  Manager    │
└─────────────┘     └─────────────┘
    │                      │
    ▼                      ▼
┌─────────────┐     ┌─────────────┐
│   Logger    │────▶│  Formatter  │
│  Pipeline   │     │   Engine    │
└─────────────┘     └─────────────┘
    │                      │
    ▼                      ▼
┌─────────────┐     ┌─────────────┐
│   Storage   │     │   Output    │
│   System    │     │  Renderer   │
└─────────────┘     └─────────────┘
```

---

## Implementation Roadmap

### Phase 1: Core Logging Infrastructure (Week 1-2)

**Objective**: Establish the foundational logging system

**Tasks**:

1. **Create logging types and interfaces**

   - Define `EvaluationStep`, `ReductionRule`, `LoggingConfig`
   - Implement `TermPath` and location tracking utilities
   - Add step metadata structures

2. **Implement step capture system**

   - Modify [`evaluate()`](src/utils/manipulation.ts:321) to capture steps
   - Create `StepTracker` class for managing evaluation history
   - Add rule detection logic for each reduction type

3. **Basic console formatter**
   - Implement simple text-based step display
   - Add basic highlighting for redexes
   - Create minimal configuration system

**Files to Create**:

- `src/logging/types.ts` - Core logging type definitions
- `src/logging/step-tracker.ts` - Step capture and management
- `src/logging/formatters/console.ts` - Console output formatter

**Files to Modify**:

- `src/utils/manipulation.ts` - Add logging to evaluation functions
- `src/index.ts` - Export new logging functionality

### Phase 2: Multi-Format Output System (Week 3-4)

**Objective**: Implement comprehensive output formatting

**Tasks**:

1. **HTML formatter with visual highlighting**

   - Create interactive HTML output with CSS styling
   - Implement redex highlighting and step navigation
   - Add collapsible step details

2. **JSON formatter for programmatic access**

   - Structured data export for analysis tools
   - Complete evaluation metadata preservation
   - API-friendly format design

3. **Plain text formatter for documentation**
   - Clean, readable text output
   - Suitable for academic papers and reports
   - Configurable verbosity levels

**Files to Create**:

- `src/logging/formatters/html.ts` - HTML output with styling
- `src/logging/formatters/json.ts` - Structured JSON export
- `src/logging/formatters/text.ts` - Plain text formatter
- `src/logging/formatters/base.ts` - Common formatter interface

### Phase 3: Advanced Features (Week 5-6)

**Objective**: Add sophisticated debugging capabilities

**Tasks**:

1. **Interactive debugging features**

   - Step-by-step execution control
   - Breakpoint system for specific rules
   - Backward stepping through evaluation history

2. **Performance profiling integration**

   - Timing measurement for each step
   - Memory usage tracking
   - Complexity analysis per step

3. **Advanced configuration system**
   - Rule filtering and selection
   - Custom highlighting schemes
   - Output customization options

**Files to Create**:

- `src/logging/debugger.ts` - Interactive debugging features
- `src/logging/profiler.ts` - Performance measurement
- `src/logging/config.ts` - Advanced configuration management

### Phase 4: Integration and Polish (Week 7-8)

**Objective**: Seamless integration with existing codebase

**Tasks**:

1. **Integration with existing evaluation strategies**

   - Ensure logging works with normal/applicative/lazy evaluation
   - Maintain performance characteristics
   - Preserve existing API compatibility

2. **Error handling and edge cases**

   - Graceful handling of infinite loops
   - Memory management for long evaluations
   - Robust error reporting

3. **Documentation and examples**
   - Comprehensive API documentation
   - Usage examples for each formatter
   - Integration guides

**Files to Modify**:

- All evaluation functions in `src/utils/manipulation.ts`
- Update type exports in `src/types/index.ts`
- Enhance documentation in README.md

### Phase 5: Testing and Optimization (Week 9-10)

**Objective**: Ensure reliability and performance

**Tasks**:

1. **Comprehensive test suite**

   - Unit tests for all logging components
   - Integration tests with evaluation system
   - Performance benchmarks

2. **Performance optimization**

   - Minimize overhead when logging is disabled
   - Optimize memory usage for step storage
   - Lazy evaluation of expensive formatting

3. **Final polish and documentation**
   - Code review and refactoring
   - Performance tuning
   - Complete documentation

**Files to Create**:

- `tests/logging/` - Complete test suite for logging system
- `benchmarks/logging-performance.ts` - Performance benchmarks

---

## Technical Specifications

### Core Function Signatures

```typescript
// Enhanced evaluation with logging
export function evaluateWithLogging(
  term: Term,
  options: EvaluationOptions & LoggingOptions,
): EvaluationResult & LoggingResult;

// Step-by-step evaluator
export function createStepEvaluator(
  term: Term,
  config: LoggingConfig,
): StepEvaluator;

// Logging pipeline
export class LoggingPipeline {
  constructor(config: LoggingConfig);

  captureStep(step: EvaluationStep): void;
  format(format: OutputFormat): string;
  export(format: ExportFormat): any;

  // Interactive features
  pause(): void;
  resume(): void;
  stepForward(): EvaluationStep | null;
  stepBackward(): EvaluationStep | null;
}

// Formatter interface
export interface StepFormatter {
  format(steps: EvaluationStep[], config: FormatterConfig): string;
  formatSingle(step: EvaluationStep, config: FormatterConfig): string;
  supportsInteractive(): boolean;
}

// Step tracker
export class StepTracker {
  constructor(maxSteps?: number);

  recordStep(before: Term, after: Term, rule: ReductionRule): void;
  getSteps(): EvaluationStep[];
  getStep(index: number): EvaluationStep | null;
  clear(): void;

  // Analysis methods
  getStepsByRule(rule: ReductionRule["type"]): EvaluationStep[];
  getTotalSteps(): number;
  getComplexityProgression(): number[];
}
```

### Data Structures

```typescript
// Complete step information
interface EvaluationStep {
  stepNumber: number;
  timestamp: number;
  rule: ReductionRule;
  before: Term;
  after: Term;
  redexLocation: TermPath;
  substitutions: Substitution[];
  timing: StepTiming;
  metadata: StepMetadata;
}

// Reduction rule details
type ReductionRule =
  | {
      type: "beta";
      redex: {
        abstraction: Term & { tag: "abs" };
        argument: Term;
        location: TermPath;
      };
    }
  | {
      type: "alpha";
      conversion: {
        oldVariable: string;
        newVariable: string;
        scope: Term;
        location: TermPath;
      };
    }
  | {
      type: "eta";
      reduction: {
        abstraction: Term & { tag: "abs" };
        reducedTo: Term;
        location: TermPath;
      };
    }
  | {
      type: "structural";
      operation: "traverse-function" | "traverse-argument" | "traverse-body";
      location: TermPath;
    };

// Logging configuration
interface LoggingConfig {
  // Output settings
  format: OutputFormat;
  verbosity: VerbosityLevel;
  destination: OutputDestination;

  // Step control
  captureSteps: StepType[];
  maxSteps: number;
  stepFilter?: (step: EvaluationStep) => boolean;

  // Visual settings
  highlighting: HighlightConfig;
  colors: ColorScheme;
  layout: LayoutConfig;

  // Performance settings
  measureTiming: boolean;
  trackMemory: boolean;
  lazyFormatting: boolean;

  // Interactive settings
  interactive: boolean;
  pauseOnRule?: ReductionRule["type"][];
  breakpoints?: BreakpointConfig[];
}

// Path tracking for term locations
type TermPath = Array<{
  direction: "function" | "argument" | "body";
  index?: number; // For future array-based structures
}>;

// Timing information
interface StepTiming {
  duration: number; // microseconds
  cumulativeTime: number;
  memoryUsage?: number;
}

// Step metadata
interface StepMetadata {
  complexity: number;
  freeVariables: string[];
  boundVariables: string[];
  isNormalForm: boolean;
  canReduce: boolean;
  nextPossibleRules: ReductionRule["type"][];
}
```

### Integration Points

```typescript
// Enhanced manipulation functions
export function betaReduceWithLogging(
  term: Term,
  logger?: StepTracker,
): { result: Term | null; step?: EvaluationStep };

export function normalizeWithLogging(
  term: Term,
  options: EvaluationOptions & LoggingOptions,
): EvaluationResult & LoggingResult;

// Existing function enhancements
export function evaluate(
  term: Term,
  options: EvaluationOptions & { logging?: LoggingConfig },
): EvaluationResult & { logging?: LoggingResult };
```

### Error Handling Strategy

```typescript
// Logging-specific errors
export class LoggingError extends Error {
  constructor(
    message: string,
    public step?: EvaluationStep,
  ) {
    super(message);
    this.name = "LoggingError";
  }
}

export class FormatterError extends LoggingError {
  constructor(
    message: string,
    public format: OutputFormat,
  ) {
    super(message);
    this.name = "FormatterError";
  }
}

export class StepCaptureError extends LoggingError {
  constructor(
    message: string,
    public term: Term,
  ) {
    super(message);
    this.name = "StepCaptureError";
  }
}

// Error recovery strategies
interface ErrorRecoveryConfig {
  continueOnError: boolean;
  maxErrors: number;
  fallbackFormatter?: OutputFormat;
  errorCallback?: (error: LoggingError) => void;
}
```

---

## Usage Examples

### Basic Step-by-Step Evaluation

```typescript
import { evaluateWithLogging, createStepEvaluator } from "lambster";

// Simple logging
const term = {
  tag: "app",
  function: {
    tag: "abs",
    symbol: "λ",
    parameter: "x",
    body: { tag: "var", name: "x" },
  },
  argument: { tag: "var", name: "y" },
};

const result = evaluateWithLogging(term, {
  logging: { format: "console", verbosity: "standard", highlightRedexes: true },
});

console.log(result.logging.formattedSteps);
```

**Output**:

```
Step 1: Beta-reduction
Before: (λx.x) y
        ^^^^^^^ ← Beta-redex
After:  x[x := y]
Rule:   β-reduction: (λx.M) N → M[x := N]

Step 2: Substitution
Before: x[x := y]
        ^^^^^^^^^
After:  y
Rule:   Variable substitution

Evaluation complete: y
Total steps: 2
Time: 0.15ms
```

### Interactive Debugging

```typescript
// Create interactive evaluator
const evaluator = createStepEvaluator(term, {
  format: "console",
  interactive: true,
  pauseOnRule: ["beta"],
});

// Step through evaluation
while (!evaluator.isComplete()) {
  const step = evaluator.nextStep();
  console.log(evaluator.formatCurrentStep());

  if (step.rule.type === "beta") {
    const input = await prompt("Continue? (y/n/b for back): ");
    if (input === "n") break;
    if (input === "b") evaluator.stepBack();
  }
}
```

### HTML Output for Web Visualization

```typescript
const htmlOutput = evaluateWithLogging(complexTerm, {
  logging: {
    format: "html",
    verbosity: "detailed",
    highlighting: { redexes: true, substitutions: true, colorScheme: "syntax" },
  },
});

// Save to file or serve via web server
fs.writeFileSync("evaluation.html", htmlOutput.logging.formattedSteps);
```

**Generated HTML**:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Lambda Calculus Evaluation</title>
    <style>
      .redex {
        background-color: #ffeb3b;
        border: 1px solid #fbc02d;
      }
      .substitution {
        background-color: #e3f2fd;
      }
      .step {
        margin: 10px 0;
        padding: 10px;
        border-left: 3px solid #2196f3;
      }
    </style>
  </head>
  <body>
    <div class="evaluation">
      <div class="step" data-step="1">
        <h3>Step 1: Beta-reduction</h3>
        <div class="before">
          Before: <span class="redex">(λx.x y) (λz.z)</span>
        </div>
        <div class="after">
          After: <span class="substitution">(x y)[x := λz.z]</span>
        </div>
        <div class="rule">Rule: β-reduction</div>
      </div>
      <!-- More steps... -->
    </div>
  </body>
</html>
```

### JSON Export for Analysis

```typescript
const jsonResult = evaluateWithLogging(term, {
  logging: {
    format: "json",
    verbosity: "debug",
    measureTiming: true,
    trackMemory: true,
  },
});

const analysisData = JSON.parse(jsonResult.logging.formattedSteps);
```

**JSON Structure**:

```json
{
  "evaluation": {
    "originalTerm": "(λx.x) y",
    "finalTerm": "y",
    "totalSteps": 2,
    "totalTime": 0.15,
    "strategy": "normal"
  },
  "steps": [
    {
      "stepNumber": 1,
      "timestamp": 1640995200000,
      "rule": {
        "type": "beta",
        "redex": {
          "abstraction": {
            "tag": "abs",
            "parameter": "x",
            "body": { "tag": "var", "name": "x" }
          },
          "argument": { "tag": "var", "name": "y" },
          "location": []
        }
      },
      "before": {
        "tag": "app",
        "function": {
          "tag": "abs",
          "parameter": "x",
          "body": { "tag": "var", "name": "x" }
        },
        "argument": { "tag": "var", "name": "y" }
      },
      "after": { "tag": "var", "name": "y" },
      "timing": {
        "duration": 0.08,
        "cumulativeTime": 0.08,
        "memoryUsage": 1024
      },
      "metadata": {
        "complexity": 3,
        "freeVariables": ["y"],
        "boundVariables": [],
        "isNormalForm": true,
        "canReduce": false,
        "nextPossibleRules": []
      }
    }
  ],
  "statistics": {
    "betaSteps": 1,
    "alphaSteps": 0,
    "etaSteps": 0,
    "structuralSteps": 1,
    "averageStepTime": 0.075,
    "peakMemoryUsage": 1024
  }
}
```

### Configuration Examples

```typescript
// Minimal logging for production
const minimalConfig: LoggingConfig = {
  format: "json",
  verbosity: "minimal",
  captureSteps: ["beta", "eta"],
  maxSteps: 100,
  measureTiming: false,
  highlighting: { redexes: false, substitutions: false },
};

// Comprehensive debugging
const debugConfig: LoggingConfig = {
  format: "html",
  verbosity: "debug",
  captureSteps: ["beta", "alpha", "eta", "structural"],
  maxSteps: 10000,
  measureTiming: true,
  trackMemory: true,
  highlighting: {
    redexes: true,
    substitutions: true,
    colorScheme: "academic",
    showPaths: true,
  },
  interactive: true,
  pauseOnRule: ["beta"],
  breakpoints: [
    { condition: "complexity > 50" },
    { condition: 'freeVariables.includes("x")' },
  ],
};

// Academic paper output
const academicConfig: LoggingConfig = {
  format: "latex",
  verbosity: "standard",
  captureSteps: ["beta", "eta"],
  highlighting: { redexes: true, style: "mathematical" },
  layout: { stepNumbering: "roman", showRuleNames: true, compactFormat: false },
};
```

### Advanced Usage Patterns

```typescript
// Custom step filtering
const customLogger = evaluateWithLogging(term, {
  logging: {
    format: "console",
    stepFilter: (step) => {
      // Only log beta-reductions that involve specific variables
      return (
        step.rule.type === "beta" && step.metadata.freeVariables.includes("x")
      );
    },
  },
});

// Performance analysis
const performanceAnalysis = evaluateWithLogging(complexTerm, {
  logging: { format: "json", measureTiming: true, trackMemory: true },
});

const stats = JSON.parse(performanceAnalysis.logging.formattedSteps).statistics;
console.log(`Average step time: ${stats.averageStepTime}ms`);
console.log(`Peak memory: ${stats.peakMemoryUsage} bytes`);

// Batch processing with logging
const terms = [term1, term2, term3];
const results = terms.map((t) =>
  evaluateWithLogging(t, { logging: { format: "json", verbosity: "minimal" } }),
);

// Aggregate analysis
const totalSteps = results.reduce(
  (sum, r) => sum + JSON.parse(r.logging.formattedSteps).evaluation.totalSteps,
  0,
);
```

---

## Performance Considerations

### Overhead Analysis

```typescript
// Performance impact measurements
interface PerformanceMetrics {
  baselineEvaluation: number; // Time without logging
  loggedEvaluation: number; // Time with logging
  overhead: number; // Percentage overhead
  memoryIncrease: number; // Additional memory usage
}

// Expected overhead by configuration
const overheadEstimates = {
  minimal: { time: "5-10%", memory: "10-20%" },
  standard: { time: "15-25%", memory: "30-50%" },
  detailed: { time: "25-40%", memory: "50-100%" },
  debug: { time: "40-60%", memory: "100-200%" },
};
```

### Optimization Strategies

1. **Lazy Formatting**: Format output only when requested
2. **Step Filtering**: Capture only relevant steps
3. **Memory Management**: Circular buffer for long evaluations
4. **Conditional Compilation**: Zero-cost abstractions when logging disabled

```typescript
// Optimized logging implementation
class OptimizedStepTracker {
  private steps: EvaluationStep[] = [];
  private maxSteps: number;
  private lazyFormatting: boolean;

  constructor(config: LoggingConfig) {
    this.maxSteps = config.maxSteps || 1000;
    this.lazyFormatting = config.lazyFormatting ?? true;
  }

  recordStep(step: EvaluationStep): void {
    // Circular buffer to prevent memory leaks
    if (this.steps.length >= this.maxSteps) {
      this.steps.shift();
    }

    // Store minimal data if lazy formatting enabled
    if (this.lazyFormatting) {
      this.steps.push(this.compressStep(step));
    } else {
      this.steps.push(step);
    }
  }

  private compressStep(step: EvaluationStep): EvaluationStep {
    // Store only essential data, compute derived data on demand
    return {
      ...step,
      metadata: undefined, // Compute when needed
      timing: this.measureTiming ? step.timing : undefined,
    };
  }
}
```

---

## Testing Strategy

### Unit Testing

```typescript
// Test structure for logging components
describe("Logging System", () => {
  describe("StepTracker", () => {
    it("should capture beta-reduction steps", () => {
      const tracker = new StepTracker();
      const before = parseExpression("(λx.x) y");
      const after = parseExpression("y");

      tracker.recordStep(before, after, { type: "beta" /* ... */ });

      expect(tracker.getSteps()).toHaveLength(1);
      expect(tracker.getSteps()[0].rule.type).toBe("beta");
    });

    it("should respect maxSteps limit", () => {
      const tracker = new StepTracker(5);

      // Add 10 steps
      for (let i = 0; i < 10; i++) {
        tracker.recordStep(/* ... */);
      }

      expect(tracker.getSteps()).toHaveLength(5);
    });
  });

  describe("Formatters", () => {
    it("should format console output correctly", () => {
      const formatter = new ConsoleFormatter();
      const step = createMockStep();

      const output = formatter.formatSingle(step, {});

      expect(output).toContain("Beta-reduction");
      expect(output).toContain("Before:");
      expect(output).toContain("After:");
    });

    it("should generate valid HTML", () => {
      const formatter = new HtmlFormatter();
      const steps = [createMockStep()];

      const html = formatter.format(steps, {});

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain('<div class="step">');
    });

    it("should produce valid JSON", () => {
      const formatter = new JsonFormatter();
      const steps = [createMockStep()];

      const json = formatter.format(steps, {});

      expect(() => JSON.parse(json)).not.toThrow();
    });
  });
});
```

### Integration Testing

```typescript
describe('Logging Integration', () => {
  it('should log complete evaluation process', ()
```
