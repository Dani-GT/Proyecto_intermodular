// Controlador para la página principal
exports.renderHome = (req, res) => {
    res.render('index', { 
        title: 'Inicio | Club Béisbol Los Tigres',
        homeActive: true 
    });
};
