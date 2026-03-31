import GitHubService from './github.js';

const ARQUIVO = 'data/vocabulary.json';
const github = new GitHubService();

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const dados = await github.ler(ARQUIVO);
            return res.status(200).json(dados);
        }

        if (req.method === 'POST') {
            const dados = await github.ler(ARQUIVO);
            const novo = { id: Date.now().toString(), ...req.body };
            dados.push(novo);
            await github.salvar(ARQUIVO, dados);
            return res.status(201).json(novo);
        }

        if (req.method === 'PUT') {
            const { id } = req.query;
            const dados = await github.ler(ARQUIVO);
            const index = dados.findIndex(item => item.id === id);
            if (index === -1) return res.status(404).json({ error: 'Não encontrado' });
            dados[index] = { ...dados[index], ...req.body };
            await github.salvar(ARQUIVO, dados);
            return res.status(200).json(dados[index]);
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            let dados = await github.ler(ARQUIVO);
            const novos = dados.filter(item => item.id !== id);
            if (novos.length === dados.length) return res.status(404).json({ error: 'Não encontrado' });
            await github.salvar(ARQUIVO, novos);
            return res.status(204).end();
        }

        return res.status(405).json({ error: 'Método não permitido' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro interno' });
    }
}