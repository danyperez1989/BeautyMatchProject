import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, where, increment, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// Agrega 'onAuthStateChanged' a la lista
import { 
    getAuth, 
    signOut, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    onAuthStateChanged // <--- AGREGA ESTO AQUÍ
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDM6UZD5UDaM4gaAlTXvdVtDFQmqFm6Irg",
    authDomain: "beautymatchproject.firebaseapp.com",
    projectId: "beautymatchproject",
    storageBucket: "beautymatchproject.firebasestorage.app",
    messagingSenderId: "55347875666",
    appId: "1:55347875666:web:70af24c088e6c630d7f48b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const provider = new GoogleAuthProvider();



// Para el botón de Google
window.loginConGoogle = () => {
    signInWithPopup(auth, provider)
        .then((result) => {

            location.reload();
        }).catch((error) => {
            console.error("Error en Google:", error);
        });
};

const estacionesInfo = { 
    "Invierno": "Subtono frío y contraste alto. Colores puros como el negro y carmesí resaltan tu piel.", 
    "Verano": "Subtono frío y bajo contraste. Tonos pasteles y azulados suavizan tus facciones.", 
    "Otoño": "Subtono cálido y profundo. Tonos tierra y ocres armonizan con tu calidez.", 
    "Primavera": "Subtono cálido y luminoso. Corales y dorados resaltan tu vitalidad." 
};

let estacionUsuario = "";
let macroActual = "maquillaje";
let subcatActual = "todos";

// --- AUTH ---
// Función para el botón de Registro

const loginBtnFinal = document.getElementById('btn-login-final');
if (loginBtnFinal) {
    loginBtnFinal.onclick = () => {
        const email = document.getElementById('email-input').value;
        const pass = document.getElementById('password-input').value;

        if (!email || !pass) return alert("Ingresa correo y contraseña");

        signInWithEmailAndPassword(auth, email, pass)
            .then(() => {
                location.reload();
            })
            .catch(e => alert("Error: " + e.message));
    };
}

// Función para manejar el Registro (CON LA LÓGICA DE MOSTRAR CAMPOS)
const regBtnFinal = document.getElementById('btn-register-final');
if (regBtnFinal) {
    regBtnFinal.onclick = async () => {
        const fields = document.getElementById('register-fields');
        const loginBtn = document.getElementById('btn-login-final');
        const nameInput = document.getElementById('name-input');

        // Paso 1: Mostrar campos adicionales si están ocultos
        if (fields.classList.contains('hidden')) {
            fields.classList.remove('hidden');
            if (loginBtn) loginBtn.classList.add('hidden');
            regBtnFinal.innerText = "Finalizar Registro";
        } 
        // Paso 2: Ejecutar el registro real
        else {
            const email = document.getElementById('email-input').value;
            const pass = document.getElementById('password-input').value;
            const nombre = nameInput.value;

            if (!email || !pass || !nombre) {
                return alert("Por favor, completa todos los campos (Nombre, Email y Password)");
            }

            try {
                regBtnFinal.disabled = true;
                regBtnFinal.innerText = "Creando cuenta...";
                
                const res = await createUserWithEmailAndPassword(auth, email, pass);
                
                // Guardar en la base de datos de usuarios
                await setDoc(doc(db, "usuarios", res.user.uid), { 
                    nombre: nombre, 
                    colorimetria: null 
                });

                alert("✅ Cuenta creada con éxito");
                location.reload();
            } catch (e) {
                alert("Error al registrar: " + e.message);
                regBtnFinal.disabled = false;
                regBtnFinal.innerText = "Finalizar Registro";
            }
        }
    };
}


onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-content').classList.remove('hidden');
        if (user.email === "admin@gmail.com") habilitarAdmin();
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        const data = snap.exists() ? snap.data() : { nombre: user.displayName };
        document.getElementById('user-display-name').innerText = `Hola, ${data.nombre}`;
        if (data.colorimetria) mostrarResultado(data.colorimetria);
        else document.getElementById('analysis-section').classList.remove('hidden');
    } else { document.getElementById('login-screen').classList.remove('hidden'); }
});

// --- TEST ---
document.getElementById('start-btn').onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById('video').srcObject = stream;
    document.getElementById('start-btn').classList.add('hidden');
    document.getElementById('analyze-btn').classList.remove('hidden');
};

document.getElementById('analyze-btn').onclick = () => {
    document.getElementById('scan-line').style.display = 'block';
    setTimeout(async () => {
        const res = ["Invierno", "Verano", "Otoño", "Primavera"][Math.floor(Math.random() * 4)];
        await setDoc(doc(db, "usuarios", auth.currentUser.uid), { colorimetria: res }, { merge: true });
        mostrarResultado(res);
    }, 2500);
};

// --- RENDER & FILTROS ---
function mostrarResultado(est) {
    estacionUsuario = est;
    document.getElementById('app').className = 'full-view';
    document.getElementById('analysis-section').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
    document.getElementById('color-result').innerText = est;
    document.getElementById('description-detail').innerText = estacionesInfo[est];

document.querySelectorAll('.macro-btn').forEach(btn => {
    btn.onclick = () => {
        // 1. Cambiar estado visual de los botones
        document.querySelectorAll('.macro-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 2. Obtener la macro categoría seleccionada
        const macro = btn.dataset.macro; // "maquillaje" o "cosmeticos"
        macroActual = macro;

        // 3. INTERCAMBIAR LISTAS DE SUBCATEGORÍAS
        if (macro === 'maquillaje') {
            document.getElementById('sub-maquillaje').classList.remove('hidden');
            document.getElementById('sub-cosmeticos').classList.add('hidden');
        } else {
            document.getElementById('sub-maquillaje').classList.add('hidden');
            document.getElementById('sub-cosmeticos').classList.remove('hidden');
        }

        // 4. Resetear subcategoría a "todos" al cambiar de macro
        subcatActual = "todos";
        
        // Resetear visualmente los items de la sub-nav
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.nav-list:not(.hidden) .nav-item[data-category="todos"]').forEach(i => i.classList.add('active'));

        renderizar(); // Volver a cargar los productos
    };
});

    document.querySelectorAll('.nav-item').forEach(item => item.onclick = () => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active'); subcatActual = item.dataset.category; renderizar();
    });
    renderizar();
}

async function renderizar() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = "<p style='grid-column:1/-1; text-align:center;'>Buscando tus tonos ideales...</p>";
    
    // Consulta a la colección de productos
    const q = query(
        collection(db, "productos"), 
        where("estacion", "==", estacionUsuario), 
        where("macro", "==", macroActual)
    );

    const snap = await getDocs(q);
    grid.innerHTML = "";
    
    if (snap.empty) {
        grid.innerHTML = "<p style='grid-column:1/-1; text-align:center;'>No hay productos disponibles para tu estación en esta categoría.</p>";
        return;
    }

    // Procesamos cada producto encontrado
    for (const productDoc of snap.docs) {
        const p = productDoc.data();
        const id = productDoc.id;

        // Filtro por subcategoría (Face, ojos, etc.)
        if (subcatActual === "todos" || p.category === subcatActual) {
            
            // BUSCAR EL RATING EN FIRESTORE
            const ratingSnap = await getDoc(doc(db, "ratings", id));
            let estrellasHtml = "☆☆☆☆☆ (0)"; // Valor por defecto
            
            if (ratingSnap.exists()) {
                const rData = ratingSnap.data();
                // Cálculo de promedio redondeado
                const promedio = Math.round(rData.suma / rData.votos);
                // Dibujamos estrellas llenas y vacías + conteo real
                estrellasHtml = "★".repeat(promedio) + "☆".repeat(5 - promedio) + ` (${rData.votos})`;
            }

            // CREAR LA TARJETA EN EL HTML
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${p.img}" alt="${p.nombre}">
                <div class="card-rating" style="color: #ffb400; font-size: 12px; margin: 5px 0;">${estrellasHtml}</div>
                <p class="product-title" style="font-weight: 600; font-size: 14px;">${p.nombre}</p>
                <p class="product-price" style="color: #d81b60; font-weight: 800; margin-top: 5px;">${p.precio}</p>
            `;
            
            card.onclick = () => abrirModal(p, id);
            grid.appendChild(card);
        }
    }
}

// --- MODAL & RATING ---
async function abrirModal(p, id) {
    const m = document.getElementById('product-modal');
    document.getElementById('modal-img').src = p.img;
    document.getElementById('modal-name').innerText = p.nombre;
    document.getElementById('modal-brand').innerText = p.marca || "";
    document.getElementById('modal-price').innerText = p.precio;
    document.getElementById('modal-desc').innerText = p.desc;
    const msg = document.getElementById('rating-msg');
    const reviewForm = document.getElementById('review-form');
    const reviewsList = document.getElementById('reviews-list');
    reviewsList.innerHTML = "<p style='font-size:12px;'>Cargando reseñas...</p>";

    msg.innerText = "Cargando tu estado...";
    cargarReseñas(id);

    

    await cargarRatingGlobal(id);

    // REFERENCIA AL VOTO ESPECÍFICO DE ESTE USUARIO
    const votoRef = doc(db, "ratings", id, "votos_usuarios", auth.currentUser.uid);
    const votoSnap = await getDoc(votoRef);

    const stars = document.querySelectorAll('#user-rating-input .star');
    
    // Si ya votó, bloqueamos las estrellas
    if (votoSnap.exists()) {
        const miVoto = votoSnap.data().valor;
        marcarEstrellas(stars, miVoto);
        msg.innerText = "Ya calificaste este producto.";
        desactivarClicks(stars);
        if (!votoSnap.data().titulo) {
            reviewForm.classList.remove('hidden');
            prepararEnvioReview(id, votoRef);
        } else {
            reviewForm.classList.add('hidden');
        }
    } else {
        msg.innerText = "¡Danos tu opinión!";
        activarClicks(stars, id, votoRef);
        reviewForm.classList.add('hidden');
    }

    m.classList.remove('hidden');

            const btnTienda = document.getElementById('btn-ver-tienda'); // Asegúrate que este sea el ID de tu botón
            btnTienda.onclick = null
        if (p.link && p.link.startsWith('http')) {
        btnTienda.onclick = () => {
            console.log("Abriendo enlace:", p.link); // Para que verifiques en la consola
            window.open(p.link, '_blank');
        };
        btnTienda.style.display = "block"; // Aseguramos que se vea
    } else {
        console.warn("El producto no tiene un link válido:", p.link);
        btnTienda.onclick = () => alert("Este producto no tiene un enlace de tienda disponible.");
    }

    // Mostrar el modal (tu lógica actual)
    document.getElementById('product-modal').classList.remove('hidden');
}
function marcarEstrellas(stars, valor) {
    stars.forEach(s => s.classList.toggle('active', s.dataset.value <= valor));
}

const closeBtn = document.querySelector('.close');
const modal = document.getElementById('product-modal');

if (closeBtn) {
    closeBtn.onclick = () => {
        modal.classList.add('hidden');
        // Opcional: limpiar el contenido para que no "parpadee" al abrir el siguiente
        document.getElementById('btn-ver-tienda').onclick = null;
    };
}

// 2. Cerrar haciendo clic en el fondo oscuro (Overlay)
window.onclick = (event) => {
    if (event.target == modal) {
        modal.classList.add('hidden');
    }
};

// 3. Cerrar con la tecla "Escape" (Plus de accesibilidad)
document.addEventListener('keydown', (event) => {
    if (event.key === "Escape") {
        modal.classList.add('hidden');
    }
});

document.addEventListener('click', (event) => {

    if (event.target && (event.target.id === 'logout-btn' || event.target.closest('#logout-btn'))) {
        const confirmar = confirm("¿Estás seguro de que quieres cerrar sesión?");
        if (confirmar) {
            try {
                // 1. Cerrar sesión en Firebase (Si usas el objeto 'auth')
                // await auth.signOut(); 

                // 2. LIMPIAR TODO EL RASTRO LOCAL
                localStorage.clear();   // Borra datos de usuario, sesión y preferencias
                sessionStorage.clear(); // Borra la sesión actual del navegador

                // 3. RE-DIRECCIÓN FORZADA
                // En lugar de reload(), mándalo al index o limpia el hash de la URL
                window.location.href = "index.html"; 
                
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
            }
        }
        return;
    }
    // 1. Si hace clic en la X (buscamos por clase 'close')
    if (event.target.classList.contains('close')) {
        const modal = document.getElementById('product-modal');
        const adminModal = document.getElementById('admin-detail-modal');
        
        if (modal) modal.classList.add('hidden');
        if (adminModal) adminModal.classList.add('hidden');
    }

    // 2. Si hace clic en el fondo oscuro (fuera del cuadro blanco)
    if (event.target.classList.contains('modal')) {
        event.target.classList.add('hidden');
    }

    if (event.target && event.target.id === 'login-submit-btn') {
        event.preventDefault(); // Evitamos que la página se recargue
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;
        
        if (typeof loginUsuario === "function") {
            loginUsuario(email, pass); // Llama a tu función existente de login
        }
    }

    // --- CASO: BOTÓN DE CREAR CUENTA ---
    if (event.target && event.target.id === 'register-submit-btn') {
        event.preventDefault();
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        const nombre = document.getElementById('reg-nombre').value;

        if (typeof registrarUsuario === "function") {
            registrarUsuario(email, pass, nombre); // Llama a tu función de registro
        }
    }

    window.manejarLogin = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    
    if(!email || !pass) return alert("Completa los datos");
    
    // Aquí llamas a tu lógica de Firebase
    console.log("Intentando entrar con:", email);
    // loginUsuario(email, pass); // Asegúrate de que esta función exista
};

window.manejarRegistro = async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const nombre = document.getElementById('reg-nombre').value;

    if(!email || !pass || !nombre) return alert("Completa todos los campos");

    // Aquí llamas a tu lógica de Firebase
    console.log("Registrando a:", nombre);
    // registrarUsuario(email, pass, nombre); // Asegúrate de que esta función exista
};

document.addEventListener('DOMContentLoaded', () => {
    
    // Configuración Botón Login
    const loginBtn = document.getElementById('btn-login-final');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;
            
            if(!email || !pass) {
                alert("Por favor, completa correo y contraseña");
                return;
            }
            
            alert("Intentando entrar con: " + email);
            // AQUÍ LLAMAS A TU FUNCIÓN: loginUsuario(email, pass);
        });
    }

    // Configuración Botón Registro
const regBtnFinal = document.getElementById('btn-register-final');
if (regBtnFinal) {
    regBtnFinal.onclick = async () => {
        const fields = document.getElementById('register-fields');
        
        // Si los campos de nombre están ocultos, los mostramos primero
        if (fields.classList.contains('hidden')) {
            fields.classList.remove('hidden');
            loginBtnFinal.classList.add('hidden'); // Ocultamos el de entrar
            regBtnFinal.innerText = "Finalizar Registro";
        } else {
            // Si ya están visibles, procedemos a crear la cuenta
            const email = document.getElementById('email-input').value;
            const pass = document.getElementById('password-input').value;
            const nombre = document.getElementById('name-input').value;

            if (!email || !pass || !nombre) {
                alert("Por favor, completa todos los campos.");
                return;
            }

            try {
                const res = await createUserWithEmailAndPassword(auth, email, pass);
                await setDoc(doc(db, "usuarios", res.user.uid), { 
                    nombre: nombre, 
                    colorimetria: null 
                });
                alert("Cuenta creada con éxito");
                location.reload();
            } catch (e) { alert("Error: " + e.message); }
        }
    };
}
});



});


function activarClicks(stars, productoId, votoRef) {
    stars.forEach(s => {
        s.onclick = async () => {
            const val = parseInt(s.dataset.value);
            marcarEstrellas(stars, val);
            
            try {
                // 1. Guardamos el voto individual para bloquear futuros intentos
                await setDoc(votoRef, { valor: val, fecha: new Date() });

                // 2. Actualizamos el promedio global
                await setDoc(doc(db, "ratings", productoId), { 
                    suma: increment(val), 
                    votos: increment(1) 
                }, { merge: true });

                document.getElementById('rating-msg').innerText = "¡Voto registrado!";
                desactivarClicks(stars);
                cargarRatingGlobal(productoId);
                document.getElementById('review-form').classList.remove('hidden');
                prepararEnvioReview(productoId, votoRef);
            } catch (e) {
                console.error("Error al votar:", e);
            }
        };
    });
}
function desactivarClicks(stars) {
    stars.forEach(s => s.onclick = null);
}
async function cargarRatingGlobal(id) {
    const snap = await getDoc(doc(db, "ratings", id));
    const display = document.getElementById('global-rating-display');
    if (snap.exists()) {
        const d = snap.data();
        const prom = Math.round(d.suma / d.votos);
        display.innerText = "★".repeat(prom) + "☆".repeat(5-prom);
        document.getElementById('rating-count').innerText = `(${d.votos} votos)`;
    }
}

// --- ADMIN & MISC ---
function habilitarAdmin() {
    // Creamos el botón flotante
    const btn = document.createElement('button');
    btn.id = "btn-admin-flotante"; // Le asignamos un ID por si acaso
    btn.innerText = "Panel Admin ⚙️";
    btn.style = "position:fixed; bottom:20px; left:20px; z-index:9999; background:#333; color:#fff; padding:12px 20px; border-radius:30px; border:none; cursor:pointer; font-weight:bold; box-shadow: 0 4px 15px rgba(0,0,0,0.3);";
    
    document.body.appendChild(btn);

    // AQUÍ es donde definimos qué pasa al hacer clic
    btn.onclick = () => {
        const adminPanel = document.getElementById('admin-panel');
        const appContent = document.getElementById('app-content');

        if (adminPanel.classList.contains('hidden')) {
            // Abrir el panel
            appContent.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            // CARGAR EL INVENTARIO
            cargarInventarioAdmin(); 
        } else {
            // Cerrar el panel
            adminPanel.classList.add('hidden');
            appContent.classList.remove('hidden');
        }
    };
}
document.getElementById('save-product-btn').onclick = async () => {
    // 1. Capturar los elementos del formulario
    const nombreInput = document.querySelector('input[placeholder="Nombre del producto"]');
    const marcaInput = document.querySelector('input[placeholder="Marca"]'); // O el placeholder que uses
    const precioInput = document.querySelector('input[placeholder="79.9"]'); // Basado en tu imagen
    const imgInput = document.querySelector('input[placeholder*="scene7"]');
    const linkInput = document.querySelector('input[placeholder*="falabella.com.pe"]');
    const macroSelect = document.querySelector('select:nth-of-type(1)'); // Categoria Principal
    const subcatSelect = document.querySelector('select:nth-of-type(2)'); // Subcategoria
    const descInput = document.querySelector('textarea');

    // 2. Validación rápida
    if (!nombreInput.value || !precioInput.value) {
        alert("Por favor completa al menos el nombre y el precio.");
        return;
    }

    // 3. Crear el objeto con datos normalizados (TODO EN MINÚSCULAS para las etiquetas)
    const nuevoProducto = {
        nombre: nombreInput.value,
        marca: marcaInput.value || "Genérico",
        precio: precioInput.value,
        img: imgInput.value,
        link: linkInput.value || "#",
        macro: "maquillaje", // Forzamos minúscula para que coincida con tus botones
        category: "ojos",     // Traducimos 'Ojos' a 'eye' que es tu filtro
        estacion: "Invierno", // Asegúrate de tener un selector para esto o forzarlo
        desc: descInput.value || ""
    };

    try {
        // Bloquear botón mientras sube
        const btn = document.getElementById('save-product-btn');
        btn.innerText = "Guardando...";
        btn.disabled = true;

        // 4. Subir a Firestore
        await addDoc(collection(db, "productos"), nuevoProducto);

        alert("✅ ¡Producto guardado con éxito!");
        
        // Limpiar formulario
        [nombreInput, marcaInput, precioInput, imgInput, linkInput, descInput].forEach(i => i.value = "");
        
        // Recargar el inventario visual si tienes la función
        if (typeof cargarInventarioAdmin === "function") cargarInventarioAdmin();

    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un error al guardar en la base de datos.");
    } finally {
        const btn = document.getElementById('save-product-btn');
        btn.innerText = "Guardar";
        btn.disabled = false;
    }
};
document.getElementById('retry-btn').onclick = () => {
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('app').className = 'mobile-view';
    document.getElementById('analysis-section').classList.remove('hidden');
    document.getElementById('cancel-test-btn').classList.remove('hidden');
};

document.getElementById('cancel-test-btn').onclick = () => {
    const v = document.getElementById('video');
    if (v.srcObject) v.srcObject.getTracks().forEach(t => t.stop());
    document.getElementById('analysis-section').classList.add('hidden');
    mostrarResultado(estacionUsuario);
};

function prepararEnvioReview(productoId, votoRef) {
    document.getElementById('save-review-btn').onclick = async () => {
        const titulo = document.getElementById('review-title').value;
        const desc = document.getElementById('review-desc').value;

        if (!titulo || !desc) return alert("Por favor escribe un título y descripción");

const userSnap = await getDoc(doc(db, "usuarios", auth.currentUser.uid));
        const nombreParaMostrar = userSnap.exists() ? userSnap.data().nombre : (auth.currentUser.displayName || "Usuario");

        try {

        await setDoc(votoRef, {
            titulo: titulo,
            comentario: desc,
            usuario: auth.currentUser.displayName || "Usuario Anónimo"
        }, { merge: true });

        document.getElementById('review-form').classList.add('hidden');
        alert("¡Reseña publicada!");
        cargarReseñas(productoId);
    }catch (e) {
            console.error("Error al guardar reseña:", e);
        }
    };
}

// NUEVA FUNCIÓN: Leer todas las reseñas del producto
async function cargarReseñas(productoId) {
    const reviewsList = document.getElementById('reviews-list');
    // Consultamos la subcolección de votos que tengan comentario
    const q = query(collection(db, "ratings", productoId, "votos_usuarios"));
    const snap = await getDocs(q);
    
    reviewsList.innerHTML = "";
    let hayComentarios = false;

    snap.forEach(doc => {
        const data = doc.data();
        if (data.titulo) { // Solo mostrar si tiene texto
            hayComentarios = true;
            const item = document.createElement('div');
            item.className = 'review-item';
            item.innerHTML = `
                <h4>${data.titulo}</h4>
                <p>${data.comentario}</p>
                <span class="review-user">Por: ${data.usuario}</span>
            `;
            reviewsList.appendChild(item);
        }
    });

    if (!hayComentarios) {
        reviewsList.innerHTML = "<p style='font-size:12px; color:#999;'>Aún no hay reseñas escritas. ¡Sé el primero!</p>";
    }
}

document.getElementById('bulk-upload-btn').onclick = async () => {
    const jsonArea = document.getElementById('admin-bulk-json');
    const btn = document.getElementById('bulk-upload-btn');
    const status = document.getElementById('upload-status'); // El texto de estado
    
    try {
        const productosLista = JSON.parse(jsonArea.value);
        
        if (!Array.isArray(productosLista)) {
            alert("Error: El contenido debe ser una lista encerrada en [ ]");
            return;
        }

        const total = productosLista.length;
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.innerText = "Procesando...";

        for (let i = 0; i < total; i++) {
            const p = productosLista[i];
            
            // Actualizamos el mensaje de carga
            status.innerText = `Subiendo: ${i + 1} de ${total} productos...`;
            status.style.color = "#d81b60";

            await addDoc(collection(db, "productos"), {
                nombre: p.nombre,
                marca: p.marca,
                precio: p.precio,
                img: p.img,
                link: p.link || "#",
                macro: p.macro,
                estacion: p.estacion,
                category: p.category,
                desc: p.desc || ""
            });
        }

        // Finalización
        status.innerText = "✅ ¡Carga masiva completada con éxito!";
        status.style.color = "#2ecc71";
        btn.innerText = "Carga Finalizada";
        
        setTimeout(() => {
            location.reload();
        }, 1500);

    } catch (e) {
        alert("Error en el formato: Revisa que sea una lista válida.");
        status.innerText = "❌ Error en el JSON";
        status.style.color = "red";
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.innerText = "🚀 Subir Todo a Firebase";
    }
};

async function cargarInventarioAdmin() {
    const listContainer = document.getElementById('admin-product-list');
    listContainer.innerHTML = "Cargando...";
    
    const snap = await getDocs(collection(db, "productos"));
    listContainer.innerHTML = "";

    snap.forEach(docSnap => {
        const p = docSnap.data();
        const item = document.createElement('div');
        item.className = 'admin-product-item';
        item.style.cursor = "pointer"; // Indica que es clicable
        
        item.innerHTML = `
            <div class="info">
                <img src="${p.img}">
                <div>
                    <strong>${p.nombre}</strong><br>
                    <small style="color: #d81b60;">Clic para ver JSON</small>
                </div>
            </div>
            <div class="actions">
                <button class="btn-delete" data-id="${docSnap.id}">Eliminar</button>
            </div>
        `;

        // CLIC EN EL CUERPO DEL ITEM PARA VER DETALLES
        item.querySelector('.info').onclick = () => verDetalleTecnico(p);
        
        listContainer.appendChild(item);
    });

    // Eventos de eliminación (mantén tu lógica anterior aquí)
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation(); // Evita que se abra el modal al querer borrar
            const id = btn.getAttribute('data-id');
            if (confirm("¿Eliminar producto?")) {
                await deleteDoc(doc(db, "productos", id));
                cargarInventarioAdmin();
            }
        };
    });
}
document.getElementById('close-admin-modal').onclick = () => {
    document.getElementById('admin-detail-modal').classList.add('hidden');
};

function verDetalleTecnico(p) {
    const modal = document.getElementById('admin-detail-modal');
    const jsonView = document.getElementById('admin-json-view');
    
    // Formateamos el objeto a texto JSON bonito
    const jsonString = JSON.stringify(p, null, 4);
    jsonView.innerText = jsonString;
    
    modal.classList.remove('hidden');

    // Botón copiar
    document.getElementById('copy-json-btn').onclick = () => {
        navigator.clipboard.writeText(jsonString);
        alert("¡Copiado al portapapeles!");
    };
}

// Función para eliminar (Opcional pero muy útil)
window.eliminarProducto = async (id) => {
    if(confirm("¿Seguro que quieres borrar este producto?")) {
        await deleteDoc(doc(db, "productos", id));
        alert("Producto eliminado");
        cargarInventarioAdmin();
    }
}

document.getElementById('back-to-app').onclick = () => {
    document.getElementById('admin-panel').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
};

const btnDelete = document.getElementById('delete-all-btn');

if (btnDelete) {
    btnDelete.onclick = async () => {
        // Primera confirmación
        const confirmar1 = confirm("¿ESTÁS SEGURO? Esto eliminará TODOS los productos de la base de datos.");
        if (!confirmar1) return;

        // Segunda confirmación (Seguridad extra)
        const confirmar2 = confirm("¿Realmente quieres borrar todo? Esta acción no se puede deshacer.");
        if (!confirmar2) return;

        btnDelete.disabled = true;
        btnDelete.innerText = "Borrando... espera";

        try {
            const querySnapshot = await getDocs(collection(db, "productos"));
            
            // Creamos una lista de promesas de borrado
            const borrados = querySnapshot.docs.map(docSnap => deleteDoc(doc(db, "productos", docSnap.id)));
            
            // Ejecutamos todos los borrados en paralelo
            await Promise.all(borrados);

            alert(`Se han eliminado ${querySnapshot.size} productos.`);
            location.reload(); 
        } catch (error) {
            console.error("Error al borrar todo:", error);
            alert("Hubo un error al intentar borrar los productos.");
            btnDelete.disabled = false;
            btnDelete.innerText = "⚠️ Borrar Todo el Inventario";
        }
    };
}       

function inicializarEstrellas() {
    const estrellas = document.querySelectorAll('.star');
    estrellas.forEach(estrella => {
        estrella.addEventListener('click', function() {
            const valor = this.getAttribute('data-value');
            
            // Quitar clase active a todas
            estrellas.forEach(s => s.style.color = '#ccc');
            
            // Poner color a las seleccionadas
            for (let i = 0; i < valor; i++) {
                estrellas[i].style.color = '#ffcc00';
            }
            // Guardar el valor en una variable global o un input oculto
            window.calificacionSeleccionada = valor;
        });
    });
}
let ratingSeleccionado = 0;

// Delegación de eventos: Escuchamos en el documento para que nunca se pierda
document.addEventListener('click', function (e) {
    // Si el usuario hace click en una estrella
        if (e.target.classList.contains('star')) {
        ratingTemporal = parseInt(e.target.getAttribute('data-value'));

        // Pintamos las estrellas visualmente para que el usuario vea su selección
        const todasLasEstrellas = document.querySelectorAll('.star');
        todasLasEstrellas.forEach(s => {
            if (parseInt(s.getAttribute('data-value')) <= ratingTemporal) {
                s.classList.add('active');
                s.style.color = '#FFD700'; // Dorado
            } else {
                s.classList.remove('active');
                s.style.color = '#ccc'; // Gris
            }
        });
        console.log("Calificación seleccionada temporalmente:", ratingTemporal);
    }

    if (e.target.id === 'save-review-btn') {
        const reviewText = document.getElementById('review-text').value;
        const productName = document.getElementById('modal-product-name').innerText;

        // Validamos que haya marcado estrellas
        if (ratingTemporal === 0) {
            alert("Por favor, selecciona una calificación con las estrellas antes de guardar.");
            return;
        }

        // LLAMADA A FIREBASE
        guardarEnFirebase(productName, ratingTemporal, reviewText);
    }

async function guardarEnFirebase(producto, estrellas, comentario) {
    try {
        await db.collection("reviews").add({
            product: producto,
            rating: estrellas,
            comment: comentario,
            date: new Date().toISOString(),
            user: auth.currentUser ? auth.currentUser.email : "Anónimo"
        });
        
        alert("¡Reseña guardada con éxito!");
        limpiarFormularioResena();
        
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un problema al guardar tu reseña.");
    }
}


function limpiarFormularioResena() {
    document.getElementById('review-text').value = "";
    ratingTemporal = 0;
    document.querySelectorAll('.star').forEach(s => {
        s.classList.remove('active');
        s.style.color = '#ccc';
    });
}
    /*
    // Si el usuario hace click en el botón de enviar
    if (e.target.id === 'btn-enviar-resena') {
        const titulo = document.getElementById('review-title').value;
        const texto = document.getElementById('review-text').value;

        if (ratingSeleccionado === 0) {
            alert("¡No olvides marcar las estrellas!");
            return;
        }
        
        // Aquí llamas a tu función de Firebase
        console.log("Enviando:", { ratingSeleccionado, titulo, texto });
        alert("Reseña enviada correctamente");
        
        // Limpiar después de enviar
        document.getElementById('review-title').value = "";
        document.getElementById('review-text').value = "";
        ratingSeleccionado = 0;
        document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
    }-*/
});
document.getElementById('close-modal').onclick = () => document.getElementById('product-modal').classList.add('hidden');
document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => location.reload());
document.getElementById('modal-product-info').innerHTML = contenidoProducto;
