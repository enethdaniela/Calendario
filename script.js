const bloques = [
    "07:00 - 08:20", "08:30 - 09:50", "10:00 - 11:20", 
    "11:30 - 12:50", "13:00 - 14:20", "14:30 - 15:50", 
    "16:00 - 17:20", "17:30 - 18:50"
];
const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Cambiamos el nombre de la llave en localStorage para no chocar con la versión anterior
let datosHorarios = JSON.parse(localStorage.getItem('horariosCompletos')) || {};

function inicializarTablaIngreso() {
    const tabla = document.getElementById('tabla-ingreso');
    let html = '<tr><th>Hora</th>';
    dias.forEach(dia => html += `<th>${dia}</th>`);
    html += '</tr>';

    bloques.forEach((bloque, filaIdx) => {
        html += `<tr><td class="td-hora">${bloque}</td>`;
        dias.forEach((dia, colIdx) => {
            html += `<td><input type="text" class="input-clase" id="slot-${filaIdx}-${colIdx}" placeholder="Libre"></td>`;
        });
        html += '</tr>';
    });
    tabla.innerHTML = html;
}

function guardarMiHorario() {
    const nombre = document.getElementById('nombre').value.trim();
    if (!nombre) {
        alert("Por favor ingresa tu nombre primero.");
        return;
    }

    const horarioUsuario = {};
    dias.forEach(dia => horarioUsuario[dia] = {});

    bloques.forEach((bloque, filaIdx) => {
        dias.forEach((dia, colIdx) => {
            const inputVal = document.getElementById(`slot-${filaIdx}-${colIdx}`).value.trim();
            // Guardamos el texto escrito, o cadena vacía si está libre
            horarioUsuario[dia][bloque] = inputVal; 
        });
    });

    datosHorarios[nombre] = horarioUsuario;
    localStorage.setItem('horariosCompletos', JSON.stringify(datosHorarios));
    
    alert(`¡Horario de ${nombre} guardado exitosamente!`);
    document.getElementById('nombre').value = '';
    
    // Limpiar celdas
    document.querySelectorAll('.input-clase').forEach(input => input.value = '');
    actualizarUI();
}

function actualizarUI() {
    const selectorVer = document.getElementById('selector-ver-horario');
    const selectorComp = document.getElementById('selector-comparacion');
    
    // Guardamos la selección actual del visor para no perderla al actualizar
    const seleccionActual = selectorVer.value;

    selectorVer.innerHTML = '<option value="">-- Elige un horario --</option>';
    selectorComp.innerHTML = '';

    Object.keys(datosHorarios).forEach(nombre => {
        // Agregar al selector de visualización
        const option = document.createElement('option');
        option.value = nombre;
        option.innerText = nombre;
        selectorVer.appendChild(option);

        // Agregar al selector de comparación
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${nombre}" checked> ${nombre}`;
        selectorComp.appendChild(label);
    });

    selectorVer.value = seleccionActual;
    mostrarHorarioIndividual(); // Refrescar la tabla si hay alguien seleccionado
}

function mostrarHorarioIndividual() {
    const nombre = document.getElementById('selector-ver-horario').value;
    const contenedor = document.getElementById('contenedor-horario-individual');
    
    if (!nombre) {
        contenedor.innerHTML = '<p style="text-align:center; color:#b2bec3;">Selecciona un nombre arriba para ver su horario.</p>';
        return;
    }

    const horario = datosHorarios[nombre];
    let html = '<table><tr><th>Hora</th>';
    dias.forEach(dia => html += `<th>${dia}</th>`);
    html += '</tr>';

    bloques.forEach(bloque => {
        html += `<tr><td class="td-hora">${bloque}</td>`;
        dias.forEach(dia => {
            const materia = horario[dia][bloque];
            if (materia) {
                html += `<td class="celda-ocupada">${materia}</td>`;
            } else {
                html += `<td></td>`;
            }
        });
        html += '</tr>';
    });
    
    html += '</table>';
    contenedor.innerHTML = html;
}

function limpiarDatos() {
    if(confirm("¿Estás segura de borrar todos los horarios? Esta acción no se puede deshacer.")) {
        datosHorarios = {};
        localStorage.setItem('horariosCompletos', JSON.stringify(datosHorarios));
        document.getElementById('resultados').innerHTML = '';
        actualizarUI();
    }
}

function compararHorarios() {
    const checkboxes = document.querySelectorAll('#selector-comparacion input:checked');
    const seleccionadas = Array.from(checkboxes).map(cb => cb.value);

    if (seleccionadas.length < 1) {
        alert("Selecciona al menos una persona para comparar.");
        return;
    }

    const resultadosDiv = document.getElementById('resultados');
    resultadosDiv.innerHTML = `<h3>Huecos libres para: ${seleccionadas.join(', ')}</h3>`;

    let huboCoincidencias = false;

    dias.forEach(dia => {
        let bloquesLibresDelDia = [];

        bloques.forEach(bloque => {
            let bloqueOcupadoPorAlguien = false;

            seleccionadas.forEach(nombre => {
                // Si la persona tiene cualquier texto en ese bloque, se considera ocupado
                if (datosHorarios[nombre][dia][bloque]) {
                    bloqueOcupadoPorAlguien = true;
                }
            });

            if (!bloqueOcupadoPorAlguien) {
                bloquesLibresDelDia.push(bloque);
            }
        });

        if (bloquesLibresDelDia.length > 0) {
            huboCoincidencias = true;
            let htmlBloques = bloquesLibresDelDia.map(b => `<span class="bloque-libre">${b}</span>`).join(' ');
            resultadosDiv.innerHTML += `
                <div class="dia-libre">
                    <strong>${dia}:</strong> <br> ${htmlBloques}
                </div>
            `;
        }
    });

    if (!huboCoincidencias) {
        resultadosDiv.innerHTML += `<p>No se encontraron horas libres en común con las personas seleccionadas. 😢</p>`;
    }
}

// Inicializar la tabla y la interfaz al cargar la página
inicializarTablaIngreso();
actualizarUI();