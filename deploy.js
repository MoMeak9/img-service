const fs = require('fs');
const Client = require('ssh2').Client;
require('dotenv').config();

// 项目构建
const { execSync } = require('child_process');
execSync('npm run build', { stdio: 'inherit' })

// SSH连接配置
const sshConfig = {
    host: process.env.HOST || '127.0.0.1',
    port: process.env.SSHPORT || 22,
    username: process.env.USER || 'root',
    privateKey: process.env.SSHKEY || fs.readFileSync(process.env.KEYFILE || '/.ssh/id_rsa').toString(),
};

// 本地目录路径和远程目录路径
const localDir = __dirname;
const remoteDir = '/www/wwwroot/img-service';


// 创建SSH连接
const conn = new Client();
// 监听ready事件
conn.on('ready', () => {
    console.log('SSH连接成功');

    // 将本地目录下的所有文件上传至服务器上指定目录
    const uploadPromise = [];
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const files = ['dist', 'package.json', '.env'];

        const uploadFile = (file) => {
            return new Promise((resolve, reject) => {
                try {
                    const localFilePath = localDir + '/' + file;
                    const remoteFilePath = remoteDir + '/' + file;
                    const readStream = fs.createReadStream(localFilePath);
                    const writeStream = sftp.createWriteStream(remoteFilePath);
                    writeStream.on('close', () => {
                        console.log(`文件 ${file} 上传成功`);
                        resolve();
                    });
                    writeStream.on('error', (err) => {
                        console.log(`文件 ${file} 上传失败：${err}`);
                        reject(err);
                    });
                    readStream.pipe(writeStream);
                } catch (error) {
                    reject(error);
                }
            });
        }

        const uploadDir = (files) => {
            files.forEach((file) => {
                // 检查是否存在文件
                const isExist = fs.existsSync(file);
                const stat = fs.lstatSync(file);
                if (!isExist) {
                    console.log(`文件 ${file} 不存在`);
                }else if (stat.isDirectory(file)){
                    const dirFiles = fs.readdirSync(file);
                    uploadDir(dirFiles.map((dirFile) => file + '/' + dirFile));
                }else if (stat.isFile(file)){
                    uploadPromise.push(uploadFile(file));
                }
            });
        }
        uploadDir(files);

        Promise.all(uploadPromise).then(() => {
            console.log('所有文件上传成功');
            // 执行SSH命令
            conn.shell((err, stream) => {
                if (err) throw err;
                stream.on('close', () => {
                    console.log('远程命令执行完毕');
                    conn.end();
                }).on('data', (data) => {
                    console.log('远程命令输出：\n' + data);
                }).stderr.on('data', (data) => {
                    console.log('远程命令错误：\n' + data);
                });
                stream.end('ls -l /www/wwwroot/img-service\npm2 restart img-service\nexit\n');
            });
        }).catch((err) => {
            console.log('上传失败：' + err);
        });
    });
}).connect(sshConfig);

// 监听error事件
conn.on('error', (err) => {
    console.error('SSH连接失败', err);
});

// 结束SSH连接
conn.on('end', () => {
    console.log('SSH连接已断开');
});
