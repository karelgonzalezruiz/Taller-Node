import express from 'express';

const app = express();
const PORT = process.env.PORT ?? 3000;

//Middleware: convierte el cuerpo JSON en req.body
app.use(express.json());

//Middleware propio: registra cada peticion
app.use((req, res, next) => {
    const hora = new Date().toISOString();
    console.log(`[${hora}] ${req.method} ${req.url}`);
    next();
});

//"Base de datos" en memoria (por ahora)
const fotos = [
    { id: 1, titulo: 'Atardecer', calificacion: 4.5, descripcion: 'Playa de Montanita'},
    { id: 2, titulo: 'Malecon', calificacion: 4.0, descripcion: 'Guayaquil de noche'},
];

//Siguiente id libre: el mayor id + 1 (no se repite aunque se borren fotos)
const siguienteId = () => Math.max(0, ...fotos.map((f) => f.id)) + 1;

app.get('/api/fotos', (req, res) => {
    res.json(fotos);
});

app.get('/api/fotos/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ mensaje: 'El id debe ser un número entero' });
    }
    const foto = fotos.find((f) => f.id === id);
    if (!foto) {
        return res.status(404).json({ mensaje: `Foto ${id} no encontrada` });
    }
    res.json(foto);
});

app.post('/api/fotos', (req, res) => {
    const { titulo, calificacion, descripcion } = req.body ?? {};
    if (typeof titulo !== 'string' || !titulo.trim()) {
        return res.status(400).json({ mensaje: 'El título es obligatorio' });
    }
    if (calificacion !== undefined &&
        (typeof calificacion !== 'number' || calificacion < 0 || calificacion > 5)) {
        return res.status(400).json({ mensaje: 'La calificación debe ser un número entre 0 y 5' });
    }
    const nueva = {
        id: siguienteId(),
        titulo: titulo.trim(),
        calificacion,
        descripcion,
    };
    fotos.push(nueva);
    res.status(201).json(nueva);
});

//PATCH: actualiza solo los campos que vienen en el cuerpo
app.patch('/api/fotos/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ mensaje: 'El id debe ser un número entero' });
    }
    const foto = fotos.find((f) => f.id === id);
    if (!foto) {
        return res.status(404).json({ mensaje: `Foto ${id} no encontrada` });
    }
    const { titulo, calificacion, descripcion } = req.body ?? {};
    if (titulo !== undefined && (typeof titulo !== 'string' || !titulo.trim())) {
        return res.status(400).json({ mensaje: 'El título no puede estar vacío' });
    }
    if (calificacion !== undefined &&
        (typeof calificacion !== 'number' || calificacion < 0 || calificacion > 5)) {
        return res.status(400).json({ mensaje: 'La calificación debe ser un número entre 0 y 5' });
    }
    if (titulo !== undefined) foto.titulo = titulo.trim();
    if (calificacion !== undefined) foto.calificacion = calificacion;
    if (descripcion !== undefined) foto.descripcion = descripcion;
    res.json(foto);
});

//DELETE: elimina la foto y responde 204 (sin cuerpo)
app.delete('/api/fotos/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ mensaje: 'El id debe ser un número entero' });
    }
    const indice = fotos.findIndex((f) => f.id === id);
    if (indice === -1) {
        return res.status(404).json({ mensaje: `Foto ${id} no encontrada` });
    }
    fotos.splice(indice, 1);
    res.status(204).end();
});

app.get('/api/error', async () => {
    throw new Error('Algo salio mal');
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
});

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});
