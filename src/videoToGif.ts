const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
export const video2Gif = async (videoPath: string, gifPath: string, width: number, fps: number) => {
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg(videoPath)
        .outputOptions('-pix_fmt', 'rgb24') // 设置像素格式为rgb24
        .output(gifPath)
        .withFPS(fps) // 设置输出GIF的帧率
        .size(`${width}x?`) // 设置输出GIF的宽度，高度等比缩放
        .noAudio() // 禁用音频输出
        .on('end', () => {
            console.log('转换完成！')
        })
        .on('error', (err:any) => console.error(err))
        .run();
}

video2Gif('F:\\个人项目\\img-service\\src\\1.mp4', 'F:\\个人项目\\img-service\\src\\1.gif', 300, 300, 10);

// 当前执行目录
// 匹配是否为绝对路径
// 下载网络图片
