export default function handler(req, res) {
    res.status(200).json({
        api: 'English Trainer',
        endpoints: {
            questions: '/api/questions',
            vocabulary: '/api/vocabulary',
            sentences: '/api/sentences'
        }
    });
}