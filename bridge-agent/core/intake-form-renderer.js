// core/intake-form-renderer.js — Ava BRIDGE Learning Agent, generic intake form
// ONE renderer for every Module's intakeSchema. This is the zero-new-HTML seam:
// a brand-new Module needs a new schema array (data), never a new form. Six
// field primitives cover every Module's intake needs today: text, textarea,
// chipList, checklist, repeatable, select.

function renderIntakeForm(container, schema, initialValues, onSubmit) {
  container.innerHTML = '';
  const values = JSON.parse(JSON.stringify(initialValues || {}));
  schema.forEach(field => {
    if (!(field.id in values)) {
      values[field.id] = field.type === 'checklist' ? []
        : field.type === 'repeatable' ? []
        : field.type === 'chipList' ? []
        : '';
    }
  });

  const form = document.createElement('form');
  form.className = 'bridge-intake-form';

  schema.forEach(field => {
    const wrap = document.createElement('div');
    wrap.className = 'bridge-field';
    const label = document.createElement('label');
    label.textContent = field.label + (field.required ? ' *' : '');
    wrap.appendChild(label);
    wrap.appendChild(renderField(field, values));
    form.appendChild(wrap);
  });

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Start';
  submitBtn.className = 'bridge-btn-primary';
  form.appendChild(submitBtn);

  form.addEventListener('submit', e => {
    e.preventDefault();
    onSubmit(values);
  });

  container.appendChild(form);

  function renderField(field, values) {
    switch (field.type) {
      case 'text': return renderText(field, values);
      case 'textarea': return renderTextarea(field, values);
      case 'select': return renderSelect(field, values);
      case 'checklist': return renderChecklist(field, values);
      case 'chipList': return renderChipList(field, values);
      case 'repeatable': return renderRepeatable(field, values);
      default: {
        const p = document.createElement('p');
        p.textContent = `(unknown field type: ${field.type})`;
        return p;
      }
    }
  }

  function renderText(field, values) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = values[field.id] || '';
    input.addEventListener('input', () => { values[field.id] = input.value; });
    return input;
  }

  function renderTextarea(field, values) {
    const ta = document.createElement('textarea');
    ta.rows = 6;
    ta.value = values[field.id] || '';
    ta.addEventListener('input', () => { values[field.id] = ta.value; });
    return ta;
  }

  function renderSelect(field, values) {
    const sel = document.createElement('select');
    (field.options || []).forEach(opt => {
      const o = document.createElement('option');
      o.value = opt; o.textContent = opt;
      sel.appendChild(o);
    });
    if (values[field.id]) sel.value = values[field.id];
    sel.addEventListener('change', () => { values[field.id] = sel.value; });
    if (!values[field.id] && field.options && field.options.length) values[field.id] = field.options[0];
    return sel;
  }

  function renderChecklist(field, values) {
    const box = document.createElement('div');
    box.className = 'bridge-checklist';
    (field.options || []).forEach(opt => {
      const row = document.createElement('label');
      row.className = 'bridge-checklist-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = (values[field.id] || []).includes(opt);
      cb.addEventListener('change', () => {
        const arr = values[field.id] || [];
        if (cb.checked) { if (!arr.includes(opt)) arr.push(opt); }
        else { values[field.id] = arr.filter(v => v !== opt); }
        values[field.id] = values[field.id] || arr;
      });
      row.appendChild(cb);
      row.appendChild(document.createTextNode(' ' + opt));
      box.appendChild(row);
    });
    return box;
  }

  function renderChipList(field, values) {
    const box = document.createElement('div');
    box.className = 'bridge-chiplist';
    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'bridge-chips';
    box.appendChild(chipsWrap);

    function redraw() {
      chipsWrap.innerHTML = '';
      (values[field.id] || []).forEach((chip, i) => {
        const chipEl = document.createElement('span');
        chipEl.className = 'bridge-chip';
        chipEl.textContent = chip + ' ';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          values[field.id].splice(i, 1);
          redraw();
        });
        chipEl.appendChild(remove);
        chipsWrap.appendChild(chipEl);
      });
    }
    redraw();

    const addRow = document.createElement('div');
    addRow.className = 'bridge-chip-add-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'type a term, then Add';
    const commit = () => {
      const v = input.value.trim();
      if (v) { values[field.id] = values[field.id] || []; values[field.id].push(v); input.value = ''; redraw(); }
    };
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.keyCode === 13) { e.preventDefault(); commit(); }
    });
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = '+ Add';
    addBtn.addEventListener('click', commit);
    addRow.appendChild(input);
    addRow.appendChild(addBtn);
    box.appendChild(addRow);
    return box;
  }

  function renderRepeatable(field, values) {
    const box = document.createElement('div');
    box.className = 'bridge-repeatable';
    const rowsWrap = document.createElement('div');
    box.appendChild(rowsWrap);

    function redraw() {
      rowsWrap.innerHTML = '';
      (values[field.id] || []).forEach((rowValues, i) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'bridge-repeatable-row';
        field.fields.forEach(sub => {
          rowEl.appendChild(renderSubField(sub, rowValues, i));
        });
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = 'Remove';
        remove.addEventListener('click', () => {
          values[field.id].splice(i, 1);
          redraw();
        });
        rowEl.appendChild(remove);
        rowsWrap.appendChild(rowEl);
      });
    }

    function renderSubField(sub, rowValues, i) {
      if (sub.type === 'checkbox') {
        const wrap = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!rowValues[sub.id];
        cb.addEventListener('change', () => { rowValues[sub.id] = cb.checked; });
        wrap.appendChild(cb);
        wrap.appendChild(document.createTextNode(' correct'));
        return wrap;
      }
      if (sub.type === 'select') {
        const sel = document.createElement('select');
        (sub.options || []).forEach(opt => {
          const o = document.createElement('option');
          o.value = opt; o.textContent = opt;
          sel.appendChild(o);
        });
        sel.value = rowValues[sub.id] || (sub.options && sub.options[0]) || '';
        rowValues[sub.id] = rowValues[sub.id] || sel.value;
        sel.addEventListener('change', () => { rowValues[sub.id] = sel.value; });
        return sel;
      }
      const input = document.createElement('input');
      input.type = 'text';
      input.value = rowValues[sub.id] || '';
      input.addEventListener('input', () => { rowValues[sub.id] = input.value; });
      return input;
    }

    redraw();

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = '+ Add';
    addBtn.addEventListener('click', () => {
      const blank = {};
      field.fields.forEach(sub => { blank[sub.id] = sub.type === 'checkbox' ? false : ''; });
      values[field.id] = values[field.id] || [];
      values[field.id].push(blank);
      redraw();
    });
    box.appendChild(addBtn);
    return box;
  }
}
