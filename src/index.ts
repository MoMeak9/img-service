import express, {Request, Response} from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config({path: path.resolve(__dirname, '../.env')});

const app = express();

// MIME 类型数组
const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];

// 公共路径
let commonPath = 'uploads/';
// 上传文件的中间件
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 1024 * 1024 * 10, // 限制文件大小为10M
    },
    fileFilter: (req, file, cb) => {
        // 限制文件类型
        if (!allowedTypes.includes(file.mimetype)) {
            cb(new Error('Invalid file type.'));
            return;
        }
        cb(null, true);
    },
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            if (!fs.existsSync('uploads/')) {
                fs.mkdirSync('uploads/');
            }
            // 获取日期
            const date = new Date();
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            commonPath = path.join(commonPath, year.toString(), month.toString().padStart(2, '0'));

            // 创建必要的目录
            fs.mkdirSync(commonPath, {recursive: true})

            // 拼接路径
            cb(null, commonPath);
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        },
    }),
});

// 允许跨域请求
app.use((req: Request, res: Response, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    next();
});

// 静态文件路由
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// 上传文件路由
app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
        res.status(400).send('Please upload a file.');
        return;
    }
    const filepath = path.resolve(__dirname, '../', commonPath, file.filename);
    // 去除原文件后缀
    file.filename = file.filename.replace(/\.[^.]+$/, '.webp');
    const output = path.resolve(__dirname, '../', commonPath, `${file.filename}`);
    // 非webp格式的图片才进行转换
    if (file.mimetype !== 'image/webp') {
        try {
            // 转换为webp格式
            await sharp(filepath)
                .toFormat('webp')
                .webp({quality: 80, effort: 6})
                .toFile(output);
            // 删除原文件
            fs.unlinkSync(filepath)
        } catch (e) {
            console.error(e)
            res.status(500).send('Error converting image to webp format.');
        }
    }
    // 返回文件信息
    commonPath = commonPath.replace(/\\/g, '/');
    res.send({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: `${process.env.BASEURL || 'http://localhost:3000'}/${commonPath}/${file.filename}`,
    });
    commonPath = 'uploads/';
});

// 启动服务器
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});
