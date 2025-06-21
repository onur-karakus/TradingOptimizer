import { state } from "./state.js";
import { calculateIndicators } from "./calculations/index.js";

let chart;

function createChart(data) {
  const options = {
    series: [
      {
        name: "candle",
        data: data.map((d) => {
          return {
            x: new Date(d.time),
            y: [d.open, d.high, d.low, d.close],
          };
        }),
      },
    ],
    chart: {
      height: "100%",
      type: "candlestick",
      toolbar: {
        show: true,
        autoSelected: "zoom",
      },
      zoom: {
        enabled: true,
        type: "x",
        autoScaleYaxis: true,
      },
    },
    title: {
      text: "CandleStick Chart",
      align: "left",
    },
    xaxis: {
      type: "datetime",
      labels: {
        datetimeUTC: false,
      },
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
      opposite: true,
      labels: {
        formatter: function (value) {
          return value.toFixed(2);
        },
      },
    },
    tooltip: {
      shared: true,
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const o = w.globals.seriesCandleO[seriesIndex][dataPointIndex];
        const h = w.globals.seriesCandleH[seriesIndex][dataPointIndex];
        const l = w.globals.seriesCandleL[seriesIndex][dataPointIndex];
        const c = w.globals.seriesCandleC[seriesIndex][dataPointIndex];
        return (
          '<div class="apexcharts-tooltip-candlestick">' +
          '<div>Open: <span class="value">' +
          o +
          "</span></div>" +
          '<div>High: <span class="value">' +
          h +
          "</span></div>" +
          '<div>Low: <span class="value">' +
          l +
          "</span></div>" +
          '<div>Close: <span class="value">' +
          c +
          "</span></div>" +
          "</div>"
        );
      },
    },
  };

  chart = new ApexCharts(document.querySelector("#chart"), options);
  chart.render();
}

/**
 * Grafik verilerini günceller ve yakınlaştırma durumunu korur.
 * @param {Array} data - Yeni grafik verisi.
 */
function updateChart(data) {
  if (!chart) {
    createChart(data);
  } else {
    // Güncellemeden önce mevcut yakınlaştırma aralığını al.
    // ApexCharts, `w.globals` içinde grafiğin mevcut durumuyla ilgili bilgileri saklar.
    const min = chart.w.globals.minX;
    const max = chart.w.globals.maxX;
    // Kullanıcının yakınlaştırma veya kaydırma yapıp yapmadığını kontrol et.
    const isZoomedOrPanned = chart.w.globals.isZoomed || chart.w.globals.isPanned;

    // Göstergeleri yeni verilere göre hesapla.
    const indicators = calculateIndicators(data, state.indicators);

    // `updateOptions` ile grafiği güncelle.
    chart.updateOptions({
      // Yakınlaştırma aralığını korumak için xaxis ayarlarını yeniden ata.
      // Eğer kullanıcı yakınlaştırma/kaydırma yaptıysa, saklanan min/max değerlerini kullan.
      // Aksi halde, `undefined` olarak bırakarak ApexCharts'ın otomatik ayarlama yapmasını sağla.
      xaxis: {
        min: isZoomedOrPanned ? min : undefined,
        max: isZoomedOrPanned ? max : undefined,
      },
      // Serileri yeni verilerle güncelle.
      series: [
        {
          name: "candle",
          data: data.map((d) => {
            return {
              x: new Date(d.time),
              y: [d.open, d.high, d.low, d.close],
            };
          }),
        },
        ...indicators.series, // Hesaplanan gösterge serilerini ekle.
      ],
      // Göstergeler için y-eksenlerini güncelle.
      yaxis: indicators.yaxis,
    });
  }
}

/**
 * Grafiği DOM'dan kaldırır.
 */
function destroyChart() {
  if (chart) {
    chart.destroy();
    chart = null;
  }
}

export { createChart, updateChart, destroyChart };
/** test