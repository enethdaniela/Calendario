import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB81esQijTVdreLMWKgwTQElS9P56W5mME",
  authDomain: "horarios-amigas.firebaseapp.com",
  projectId: "horarios-amigas",
  storageBucket: "horarios-amigas.firebasestorage.app",
  messagingSenderId: "575018759883",
  appId: "1:575018759883:web:34d1692b7b28a09a62cd4e",
  measurementId: "G-DKBGYCV7Q7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// VARIABLES GLOBALES Y LÓGICA DE SALAS

const bloques = [
    "07:00 - 08:20", "08:30 - 09:50", "10:00 - 11:20", 
    "11:30 - 12:50", "13:00 - 14:20", "14:30 - 15:50", 
    "16:00 - 17:20", "17:30 - 18:50"
];
const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

let datosHorarios = {};
let salaActual = localStorage.getItem('salaHorarios') || ''; 
let listenerFirebase = null;

// FUNCIONES DE SALAS (GRUPOS)

function unirseASala() {
    const inputSala = document.getElementById('nombre-sala').value.trim().toLowerCase();
    if (!inputSala) {
        alert("Por favor escribe el nombre de un grupo.");
        return;
    }
    
    // Guardamos la sala en la memoria local para que no la pierdas al recargar
    salaActual = inputSala;
    localStorage.setItem('salaHorarios', salaActual);
    
    conectarABaseDeDatos();
}

function conectarABaseDeDatos() {
    if (!salaActual) {
        document.getElementById('estado-sala').innerHTML = "🔴 No estás en ningún grupo. Escribe un código arriba.";
        return;
    }

    document.getElementById('estado-sala').innerHTML = `🟢 Conectada al grupo: <strong>${salaActual.toUpperCase()}</strong>`;
    document.getElementById('nombre-sala').value = '';

    // Si ya estábamos escuchando otra sala, cancelamos esa conexión
    if (listenerFirebase) {
        listenerFirebase(); 
    }

    // Escuchamos SOLO los horarios de la sala actual
    const horariosRef = ref(db, `salas/${salaActual}/horarios`);
    listenerFirebase = onValue(horariosRef, (snapshot) => {
        const data = snapshot.val();
        datosHorarios = data || {};
        actualizarUI();
    });
}

// FUNCIONES DEL CALENDARIO

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
    if (!salaActual) {
        alert("¡Primero debes unirte a un grupo en la parte de arriba!");
        return;
    }

    const nombre = document.getElementById('nombre').value.trim();
    if (!nombre) {
        alert("Por favor ingresa tu nombre.");
        return;
    }

    const horarioUsuario = {};
    dias.forEach(dia => horarioUsuario[dia] = {});

    bloques.forEach((bloque, filaIdx) => {
        dias.forEach((dia, colIdx) => {
            const inputVal = document.getElementById(`slot-${filaIdx}-${colIdx}`).value.trim();
            horarioUsuario[dia][bloque] = inputVal; 
        });
    });

    set(ref(db, `salas/${salaActual}/horarios/${nombre}`), horarioUsuario)
        .then(() => {
            alert(`¡Horario de ${nombre} guardado en el grupo ${salaActual.toUpperCase()}!`);
            document.getElementById('nombre').value = '';
            document.querySelectorAll('.input-clase').forEach(input => input.value = '');
        })
        .catch((error) => alert("Error al guardar: " + error));
}

function actualizarUI() {
    const selectorVer = document.getElementById('selector-ver-horario');
    const selectorComp = document.getElementById('selector-comparacion');
    
    const seleccionActual = selectorVer.value;

    selectorVer.innerHTML = '<option value="">-- Elige un horario --</option>';
    selectorComp.innerHTML = '';

    Object.keys(datosHorarios).forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        option.innerText = nombre;
        selectorVer.appendChild(option);

        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${nombre}" checked> ${nombre}`;
        selectorComp.appendChild(label);
    });

    selectorVer.value = seleccionActual;
    mostrarHorarioIndividual(); 
}

function mostrarHorarioIndividual() {
    const nombre = document.getElementById('selector-ver-horario').value;
    const contenedor = document.getElementById('contenedor-horario-individual');
    
    if (!nombre || !datosHorarios[nombre]) {
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
    if (!salaActual) return;
    if(confirm(`¿Estás segura de borrar todos los horarios del grupo ${salaActual.toUpperCase()}?`)) {
        remove(ref(db, `salas/${salaActual}/horarios`));
        document.getElementById('resultados').innerHTML = '';
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
        let primerBloqueOcupadoIndex = -1;

        for (let i = 0; i < bloques.length; i++) {
            let bloque = bloques[i];
            let alguienTieneClase = seleccionadas.some(nombre => datosHorarios[nombre][dia][bloque]);
            if (alguienTieneClase) {
                primerBloqueOcupadoIndex = i;
                break;
            }
        }

        if (primerBloqueOcupadoIndex === -1) return;

        for (let i = primerBloqueOcupadoIndex; i < bloques.length; i++) {
            let bloque = bloques[i];
            let bloqueOcupadoPorAlguien = seleccionadas.some(nombre => datosHorarios[nombre][dia][bloque]);

            if (!bloqueOcupadoPorAlguien) {
                bloquesLibresDelDia.push(bloque);
            }
        }

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

// Asignar eventos
document.getElementById('btn-unirse').addEventListener('click', unirseASala);
document.getElementById('btn-guardar').addEventListener('click', guardarMiHorario);
document.getElementById('btn-borrar').addEventListener('click', limpiarDatos);
document.getElementById('btn-comparar').addEventListener('click', compararHorarios);
document.getElementById('selector-ver-horario').addEventListener('change', mostrarHorarioIndividual);

// Iniciar aplicación
inicializarTablaIngreso();
conectarABaseDeDatos();
