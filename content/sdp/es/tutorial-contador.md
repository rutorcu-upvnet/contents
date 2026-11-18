---
title: "Proyecto 0: Tutorial de diseño de un contador"
draft: false
tags:
  - verilog
  - quartus
  - modelsim
---

prev > [[index|Volver al índice]]

<link rel="stylesheet" href="../../static/step-navigation.css" />

<div class="step-container">

<div class="step active" data-step="1">

## Presentación

Este tutorial sirve para familiarizarse con el flujo de diseño de la asignatura: describir circuitos en Verilog, sintetizarlos con Quartus, verificarlos con _testbenches_ en ModelSim y probarlos en la FPGA de la placa DE2-115.

El diseño es un contador módulo 10. Primero se implementa y verifica el contador; después se añade un divisor de frecuencia para que la cuenta pueda observarse en los LEDs.

### Objetivos

- Familiarizarse con el formato de las prácticas y el entorno de SDP.
- Crear diseños jerárquicos y parametrizables en Verilog.
- Verificar circuitos mediante _testbenches_.
- Sintetizar y comprobar físicamente un diseño en la FPGA.

### Requisitos y documento original

El tutorial original está escrito para Quartus Prime 17.1 y ModelSim-Altera. Los nombres de menús pueden variar en otras versiones.

[Descargar el tutorial original (PDF)](../Proyecto%200%20-%20Tutorial%20_ESP_-1.pdf)

</div>

<div class="step" data-step="2">

## Apartado 1: Contador parametrizable

Diseña un contador síncrono ascendente con estas características:

- Reloj **CLK**, activo por flanco de subida.
- Reset asíncrono **RSTn**, activo a nivel bajo.
- Entrada de habilitación **ENABLE**, activa a nivel alto.
- Módulo configurable mediante el parámetro `modulo`.
- Bus **COUNT** con el valor actual y salida **TC** activa al llegar al fin de cuenta.

### Descripción RTL

En Quartus, crea un proyecto vacío para el dispositivo Cyclone IV E **EP4CE115F29C7** y selecciona Verilog HDL y ModelSim-Altera como simulador. Crea `counter.v` con el siguiente módulo:

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

`$clog2(modulo)` calcula los bits necesarios para representar los valores de 0 a `modulo-1`. Usa el mismo nombre para el módulo y el fichero para evitar problemas de compilación.

En **Project Navigator**, establece `counter.v` como _Top-Level Entity_ y ejecuta **Analysis & Synthesis**. Revisa los mensajes de Quartus: corrige los errores y comprueba que no haya _warnings_ indicativos de latches, señales sin definir o anchos incompatibles. En **Tools > Netlist Viewers > RTL Viewer** puedes inspeccionar el circuito inferido.

</div>

<div class="step" data-step="3">

### Testbench y simulación RTL

Crea `tb_counter.v`. Este _testbench_ aplica el reset, activa y desactiva `ENABLE` y permite observar una cuenta completa:

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

    $display("Fin de la simulacion");
    $stop;
  end

endmodule
```

Configura `tb_counter` en **Assignments > Settings > EDA Tool Settings > Simulation > Test Benches**. El _testbench_ no forma parte del circuito que se sintetiza; puedes quitarlo de la lista de ficheros del proyecto sin borrarlo de la carpeta.

Ejecuta **Tools > Run Simulation Tool > RTL Simulation**. En ModelSim, abre **Wave** y ajusta el zoom para ver toda la simulación. Si quieres leer `COUNT` en decimal, haz clic derecho sobre la señal y selecciona **Radix > Unsigned**. Comprueba el reset, la cuenta por flanco de subida, el retorno a cero tras 9, `TC` y la habilitación.

### Simulación gate-level

La simulación RTL no modela los retardos de la implementación. Para observarlos, realiza una compilación completa y ejecuta **Tools > Run Simulation Tool > Gate Level Simulation**. Cierra la ventana de ModelSim de la simulación anterior antes de iniciar esta. En la simulación gate-level las salidas cambian con retardo respecto al reloj y pueden aparecer _glitches_.

</div>

<div class="step" data-step="4">

### Programación de la placa

En **Assignments > Pin Planner**, asigna los pines siguientes:

| Señal      | Pin  | Elemento de la placa |
| ---------- | ---- | -------------------- |
| `CLK`      | Y2   | Oscilador de 50 MHz  |
| `COUNT[3]` | F21  | LEDR3                |
| `COUNT[2]` | E19  | LEDR2                |
| `COUNT[1]` | F19  | LEDR1                |
| `COUNT[0]` | G19  | LEDR0                |
| `ENABLE`   | AB28 | SW0                  |
| `RSTn`     | M23  | KEY0                 |
| `TC`       | G21  | LEDG7                |

Recompila el diseño completo, abre **Tools > Programmer** y programa la FPGA mediante **USB-Blaster**. Comprueba la cuenta en los LEDs y el efecto del interruptor `SW0`.

</div>

<div class="step" data-step="5">

## Apartado 2: Contador con divisor de frecuencia

El oscilador de la placa funciona a 50 MHz (periodo de 20 ns), demasiado rápido para observar la cuenta a simple vista. En un diseño síncrono se mantiene el mismo reloj y se usa un contador divisor para generar una habilitación periódica. Para actualizar la cuenta cada 500 ms:

```text
N = 500 ms / 20 ns = 25 000 000 ciclos
```

El divisor genera `cnt_en`, que habilita el contador módulo 10. Crea `counter_with_divider.v`:

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

Establece `counter_with_divider` como _top_ y vuelve a sintetizar. Comprueba en el RTL Viewer que aparecen los dos contadores y su conexión.

</div>

<div class="step" data-step="6">

### Simulación acelerada y señales internas

Simular varios segundos con el divisor real puede tardar mucho. El parámetro permite usar un módulo pequeño solo en el _testbench_, sin cambiar el valor por defecto usado al programar la FPGA. Crea `tb_counter_with_divider.v`:

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

    $display("Fin de la simulacion");
    $stop;
  end

endmodule
```

Configura este nuevo _testbench_ como el activo y ejecuta una simulación RTL. En ModelSim, selecciona las instancias en **Structure** y las señales en **Objects** para añadir a **Wave** las señales internas `cnt_en` y `COUNT` de `freq_divider`. Si las señales se añadieron después de iniciar la simulación, usa **Restart** y después **Run -All** para generar y mostrar sus formas de onda.

Comprueba que la cuenta de 0 a 9 avanza con la periodicidad esperada para el divisor de módulo 5.

### Programación y ampliaciones

Antes de programar la versión completa, elimina del Pin Planner las asignaciones de `TC` y `ENABLE`, que ya no son puertos del diseño superior. Compila y programa la FPGA: la compilación física usa el valor por defecto de `modulo_divisor` (**25 000 000**), no el valor reducido configurado en el _testbench_. La cuenta debe actualizarse aproximadamente cada medio segundo.

Como ampliaciones opcionales:

1. Añade una entrada de habilitación controlada por `SW0` para detener y reanudar la cuenta.
2. Diseña un decodificador hexadecimal de 7 segmentos y muestra la cuenta en `HEX0`. Los displays de la placa son de ánodo común y se controlan con señales activas a nivel bajo. Para `HEX0[6:0]`, los pines son `H22`, `J22`, `L25`, `L26`, `E17`, `F22` y `G18`, respectivamente.

</div>

<div class="navigation">
  <button id="prevBtn">Anterior</button>
  <div class="step-indicator">
    <span><span id="currentStep">1</span> de <span id="totalSteps">6</span></span>
  </div>
  <button id="nextBtn">Siguiente</button>
</div>

</div>

next > [[proyecto1-juego-luces|Proyecto 1: Diseño de un juego de luces]]
