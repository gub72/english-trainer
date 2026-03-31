import GitHubService from './github.js';

const github = new GitHubService();

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { questions, vocabulary, sentences } = req.body;

        if (!questions || !vocabulary || !sentences) {
            return res.status(400).json({ error: 'Missing data: questions, vocabulary, and sentences are required.' });
        }

        await Promise.all([
            github.salvar('data/questions.json', questions),
            github.salvar('data/vocabulary.json', vocabulary),
            github.salvar('data/sentences.json', sentences),
        ]);

        return res.status(200).json({ success: true, message: 'All data saved successfully.' });
    } catch (error) {
        console.error('Error saving all data:', error);
        return res.status(500).json({ error: 'Erro interno ao salvar dados.' });
    }
}
