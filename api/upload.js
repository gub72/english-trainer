import GitHubService from './github.js';

const github = new GitHubService();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { file, fileName, fileType } = req.body;

        if (!file || !fileName) {
            return res.status(400).json({ error: 'File and fileName are required.' });
        }

        // Clean base64 and original filename
        const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
        const cleanFileName = fileName.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        
        // Add timestamp to filename to prevent overwriting
        const finalFileName = `${Date.now()}_${cleanFileName}`;
        const path = `public/assets/vocab/${finalFileName}`;

        await github.salvarBinario(path, base64Data, fileName);

        // Path for the frontend to use in the JSON
        const publicPath = `/assets/vocab/${finalFileName}`;

        return res.status(200).json({ 
            success: true, 
            path: publicPath,
            message: 'Image uploaded successfully.' 
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        const detail = error.response?.data?.message || error.message;
        return res.status(500).json({ 
            error: 'Erro interno ao fazer upload da imagem.',
            details: detail
        });
    }
}
