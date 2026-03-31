import axios from 'axios';

const GITHUB_API = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN;
const USER = process.env.GITHUB_USER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || 'main';

export default class GitHubService {
    async ler(arquivo) {
        try {
            const url = `${GITHUB_API}/repos/${USER}/${REPO}/contents/${arquivo}`;
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const conteudo = Buffer.from(response.data.content, 'base64').toString('utf-8');
            return JSON.parse(conteudo);
        } catch (error) {
            if (error.response?.status === 404) return [];
            throw error;
        }
    }

    async salvar(arquivo, dados) {
        const content = Buffer.from(JSON.stringify(dados, null, 2)).toString('base64');
        return this.writeToGitHub(arquivo, content, `Update ${arquivo}`);
    }

    async salvarBinario(arquivo, contentBase64, originalName) {
        return this.writeToGitHub(arquivo, contentBase64, `Upload image ${originalName} to ${arquivo}`);
    }

    async writeToGitHub(arquivo, content, message) {
        let sha = null;
        try {
            const url = `${GITHUB_API}/repos/${USER}/${REPO}/contents/${arquivo}`;
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            sha = response.data.sha;
        } catch (error) {
            if (error.response?.status !== 404) throw error;
        }

        const payload = {
            message,
            content,
            branch: BRANCH,
            ...(sha && { sha })
        };

        const url = `${GITHUB_API}/repos/${USER}/${REPO}/contents/${arquivo}`;
        await axios.put(url, payload, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        return true;
    }
}