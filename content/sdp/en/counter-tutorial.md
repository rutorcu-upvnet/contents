---
title: "Project 0: Counter design tutorial"
draft: false
tags:
  - verilog
  - quartus
  - modelsim
---

prev > [[qar-archive|Help: creating QAR files]]

<link rel="stylesheet" href="../../static/step-navigation.css" />

<div class="step-container">

<div class="step active" data-step="1">

## Overview

This tutorial introduces the design workflow used in the course: describe circuits in Verilog, synthesize them with Quartus, verify them with ModelSim testbenches, and test them on the DE2-115 FPGA board.

The design is a modulo-10 counter. First, implement and verify the counter; then add a frequency divider so that its count can be observed on the LEDs.

### Goals

- Become familiar with the SDP lab format and tools.
- Create hierarchical, parameterisable Verilog designs.
- Verify circuits with testbenches.
- Synthesize and physically test a design on the FPGA.

### Tool versions

The original tutorial was written for Quartus Prime 17.1 and ModelSim-Altera. Menu names may differ in other versions.

</div>

<div class="step" data-step="2">

## Part 1: Parameterisable counter

Design a synchronous up-counter with the following specifications:

- **CLK** clock, active on the rising edge.
- **RSTn** asynchronous reset, active low.
- **ENABLE** active-high enable input.
- Configurable modulus through the `modulo` parameter.
- **COUNT** output bus with the current value and **TC** output, active when the count reaches its terminal value.

### RTL description

In Quartus, create an empty project for the Cyclone IV E **EP4CE115F29C7** device, and select Verilog HDL and ModelSim-Altera as the simulator. Create `counter.v` with this module:

```verilog
module counter (CLK, RSTn, ENABLE, COUNT, TC);

  parameter modulo = 10;
  localparam n = $clog2(modulo);

  input CLK, RSTn, ENABLE;
  output reg [n-1:0] COUNT;
  output TC;

  always @(posedge CLK or negedge RSTn)
    if (RSTn == 0)
      COUNT <= 0;
    else if (ENABLE == 1)
      if (COUNT == modulo-1)
        COUNT <= 0;
      else
        COUNT <= COUNT + 1;

  assign TC = (COUNT == modulo-1) ? 1 : 0;

endmodule
```

`$clog2(modulo)` calculates the number of bits needed to represent values from 0 to `modulo-1`. Use the same name for the module and its file to avoid compilation problems.

In **Project Navigator**, set `counter.v` as the _Top-Level Entity_ and run **Analysis & Synthesis**. Review the Quartus messages: fix errors and check that there are no warnings indicating latches, undefined signals, or incompatible bus widths. Open **Tools > Netlist Viewers > RTL Viewer** to inspect the inferred circuit.

</div>

<div class="step" data-step="3">

### Testbench and RTL simulation

Create `tb_counter.v`. This testbench applies reset, enables and disables counting, and lets you observe a complete count:

```verilog
`timescale 1ns/100ps

module tb_counter ();

  localparam T = 20;

  reg CLK, RSTn, ENABLE;
  wire TC;
  wire [3:0] COUNT;

  counter duv (
    .CLK(CLK),
    .RSTn(RSTn),
    .ENABLE(ENABLE),
    .COUNT(COUNT),
    .TC(TC)
  );

  always
    #(T/2) CLK = ~CLK;

  initial
  begin
    CLK = 0;
    RSTn = 0;
    ENABLE = 0;
    #(T*2)
    RSTn = 1;
    #(T*2)
    ENABLE = 1;
    #(T*14)
    ENABLE = 0;
    #(T*4)

    $display("End of simulation");
    $stop;
  end

endmodule
```

Configure `tb_counter` in **Assignments > Settings > EDA Tool Settings > Simulation > Test Benches**. A testbench is not part of the circuit being synthesized; you can remove it from the project's file list without deleting it from the project folder.

Run **Tools > Run Simulation Tool > RTL Simulation**. In ModelSim, open **Wave** and zoom out to see the whole simulation. To read `COUNT` in decimal, right-click the signal and select **Radix > Unsigned**. Check reset, rising-edge counting, wraparound after 9, `TC`, and the enable input.

### Gate-level simulation

RTL simulation does not model implementation delays. To observe them, run a full compilation and then **Tools > Run Simulation Tool > Gate Level Simulation**. Close the previous ModelSim window before starting this simulation. In gate-level simulation, outputs change after the clock edge and glitches may appear.

</div>

<div class="step" data-step="4">

### Programming the board

In **Assignments > Pin Planner**, assign these pins:

| Signal     | Pin  | Board component   |
| ---------- | ---- | ----------------- |
| `CLK`      | Y2   | 50 MHz oscillator |
| `COUNT[3]` | F21  | LEDR3             |
| `COUNT[2]` | E19  | LEDR2             |
| `COUNT[1]` | F19  | LEDR1             |
| `COUNT[0]` | G19  | LEDR0             |
| `ENABLE`   | AB28 | SW0               |
| `RSTn`     | M23  | KEY0              |
| `TC`       | G21  | LEDG7             |

Recompile the full design, open **Tools > Programmer**, and program the FPGA via **USB-Blaster**. Check the count on the LEDs and the effect of switch `SW0`.

</div>

<div class="step" data-step="5">

## Part 2: Counter with a frequency divider

The board oscillator runs at 50 MHz (20 ns period), which is too fast to observe the count. A synchronous design keeps the same clock and uses a divider counter to generate a periodic enable. To update the count every 500 ms:

```text
N = 500 ms / 20 ns = 25,000,000 cycles
```

The divider generates `cnt_en`, which enables the modulo-10 counter. Create `counter_with_divider.v`:

```verilog
module counter_with_divider (CLK, RSTn, COUNT);

  parameter modulo_divisor = 25000000;

  input CLK, RSTn;
  output [3:0] COUNT;

  wire cnt_en;

  counter #(.modulo(modulo_divisor)) freq_divider (
    .CLK(CLK),
    .RSTn(RSTn),
    .ENABLE(1'b1),
    .COUNT(),
    .TC(cnt_en)
  );

  counter #(.modulo(10)) final_counter (
    .CLK(CLK),
    .RSTn(RSTn),
    .ENABLE(cnt_en),
    .COUNT(COUNT),
    .TC()
  );

endmodule
```

Set `counter_with_divider` as the _top_ and synthesize again. Check in the RTL Viewer that both counters and their connection are present.

</div>

<div class="step" data-step="6">

### Accelerated simulation and internal signals

Simulating several seconds with the real divider can take a long time. The parameter lets the testbench use a smaller modulus without changing the default value used to program the FPGA. Create `tb_counter_with_divider.v`:

```verilog
`timescale 1ns/100ps

module tb_counter_with_divider ();

  localparam T = 20;

  reg CLK, RSTn;
  wire [3:0] COUNT;

  counter_with_divider #(.modulo_divisor(5)) duv (
    .CLK(CLK),
    .RSTn(RSTn),
    .COUNT(COUNT)
  );

  always
    #(T/2) CLK = ~CLK;

  initial
  begin
    CLK = 0;
    RSTn = 0;
    #(T*2)
    RSTn = 1;
    #(T*2000)

    $display("End of simulation");
    $stop;
  end

endmodule
```

Configure this new testbench as the active one and run an RTL simulation. In ModelSim, select instances in **Structure** and signals in **Objects** to add the internal `cnt_en` and `freq_divider`'s `COUNT` signals to **Wave**. If the signals were added after the simulation started, use **Restart** and then **Run -All** to generate and display their waveforms.

Check that the count from 0 to 9 advances at the expected rate for a modulus-5 divider.

### Programming and extensions

Before programming the full design, remove the `TC` and `ENABLE` assignments from Pin Planner; they are no longer top-level ports. Compile and program the FPGA: the hardware build uses the default `modulo_divisor` (**25,000,000**), not the reduced testbench value. The count should update about every half second.

Optional extensions:

1. Add an enable input controlled by `SW0` to pause and resume the count.
2. Design a hexadecimal seven-segment decoder and display the count on `HEX0`. The board displays are common-anode and use active-low signals. For `HEX0[6:0]`, the pins are `H22`, `J22`, `L25`, `L26`, `E17`, `F22`, and `G18`, respectively.

</div>

<div class="navigation">
  <button id="prevBtn">Previous</button>
  <div class="step-indicator">
    <span><span id="currentStep">1</span> of <span id="totalSteps">6</span></span>
  </div>
  <button id="nextBtn">Next</button>
</div>

</div>

next > [[project1-lighting-effect|Project 1: Design of a lighting effect]]
