(function () {
  var $ = function (id) { return document.getElementById(id); };
  var inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
  var money = function (n) { return '₹' + inr.format(n); };

  var scenarioUnits = [1, 10, 20, 30, 50];

  function num(el, fallback) {
    var v = parseFloat(el.value);
    return isNaN(v) || v < 0 ? fallback : v;
  }

  function calc(price, marginPct, units, days) {
    var marginUnit = price * marginPct / 100;
    return {
      marginUnit: marginUnit,
      uddisPrice: price - marginUnit,
      daily: marginUnit * units,
      monthly: marginUnit * units * days,
      revenue: price * units * days
    };
  }

  function readInputs() {
    var mrp = Math.max(num($('mrp'), 1), 1);
    var price = num($('price'), 0);
    var capped = price > mrp;
    if (capped) price = mrp;
    return {
      mrp: mrp,
      price: price,
      capped: capped,
      margin: Math.min(num($('margin'), 0), 100),
      units: num($('units'), 0),
      days: num($('days'), 0)
    };
  }

  function render() {
    var s = readInputs();
    var r = calc(s.price, s.margin, s.units, s.days);

    $('ceilingWarn').classList.toggle('d-none', !s.capped);
    $('priceOut').textContent = money(s.price);
    $('marginOut').textContent = s.margin + '%';

    $('marginUnit').textContent = money(r.marginUnit);
    $('uddisPrice').textContent = money(r.uddisPrice);
    $('dailyProfit').textContent = money(r.daily);
    $('monthlyProfit').textContent = money(r.monthly);
    $('monthlyRevenue').textContent = money(r.revenue);

    // ceiling bar
    var pct = Math.min(s.price / s.mrp * 100, 100);
    $('priceBar').style.width = pct + '%';
    $('priceBar').textContent = Math.round(pct) + '%';
    $('mrpLabel').textContent = 'MRP ' + money(s.mrp);
    var off = s.mrp - s.price;
    $('ceilingNote').textContent = off > 0
      ? 'You sell ₹' + inr.format(off) + ' below MRP (' + inr.format(off / s.mrp * 100) + '% cheaper for students).'
      : 'You sell at MRP.';

    renderScenarios(s);
  }

  function renderScenarios(s) {
    var tbody = $('scenarioTable');
    // rebuild only if row count changed, so typing keeps focus
    if (tbody.children.length !== scenarioUnits.length) {
      tbody.innerHTML = scenarioUnits.map(function (u, i) {
        return '<tr><td><input type="number" min="0" step="1" class="form-control form-control-sm" data-i="' + i + '" value="' + u + '"></td>' +
          '<td class="text-end"></td><td class="text-end fw-semibold"></td><td class="text-end"></td>' +
          '<td class="text-end"><button class="btn btn-sm btn-link text-danger p-0" data-del="' + i + '" aria-label="Remove row">✕</button></td></tr>';
      }).join('');
    }
    scenarioUnits.forEach(function (u, i) {
      var r = calc(s.price, s.margin, u, s.days);
      var tds = tbody.children[i].children;
      tds[1].textContent = money(r.daily);
      tds[2].textContent = money(r.monthly);
      tds[3].textContent = money(r.revenue);
    });
  }

  // sync number <-> range
  function link(rangeId, numId) {
    $(rangeId).addEventListener('input', function () { $(numId).value = this.value; render(); });
    $(numId).addEventListener('input', function () { $(rangeId).value = this.value; render(); });
  }
  link('priceRange', 'price');
  link('marginRange', 'margin');

  $('mrp').addEventListener('input', function () {
    var mrp = Math.max(num($('mrp'), 1), 1);
    $('priceRange').max = mrp;
    if (num($('price'), 0) > mrp) { $('price').value = mrp; $('priceRange').value = mrp; }
    render();
  });
  $('price').addEventListener('input', function () {
    // let user see the warning; clamp the slider only
    var mrp = Math.max(num($('mrp'), 1), 1);
    if (num($('price'), 0) > mrp) $('priceRange').value = mrp;
  });
  ['units', 'days'].forEach(function (id) { $(id).addEventListener('input', render); });

  $('scenarioTable').addEventListener('input', function (e) {
    var i = e.target.getAttribute('data-i');
    if (i === null) return;
    var v = parseFloat(e.target.value);
    scenarioUnits[i] = isNaN(v) || v < 0 ? 0 : v;
    render();
  });
  $('scenarioTable').addEventListener('click', function (e) {
    var i = e.target.getAttribute('data-del');
    if (i === null) return;
    scenarioUnits.splice(i, 1);
    $('scenarioTable').innerHTML = '';
    render();
  });
  $('addRow').addEventListener('click', function () {
    var last = scenarioUnits.length ? scenarioUnits[scenarioUnits.length - 1] : 0;
    scenarioUnits.push(last + 10);
    render();
  });

  render();
})();
