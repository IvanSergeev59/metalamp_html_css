const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin') // плагин обработки html кода
const {CleanWebpackPlugin} = require('clean-webpack-plugin') // плагин очистки дублей
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserWebpackPlugin = require('terser-webpack-plugin');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
const globule = require("globule");
const fs = require("fs");
const isDev = process.env.NODE_ENV === 'development';
const isProd= !isDev;


const optimization = () => { //Переменная, добавляющая в случае продакшен сборки минимизацию js файлов и html файлов, добавляет файл оптимизации
    const config = {
        splitChunks: {
            chunks: 'all'
        }
    }
    if (isProd) {
        config.minimizer = [
            new CssMinimizerPlugin(),
            new TerserWebpackPlugin()
        ]
    }
    return config
}

const filename = ext => isDev ? `[name].${ext}` : `[name].[hash].${ext}` //формирование имени выходных файлов в зависимости от типа сборки

const cssLoaders = extra => { // унификация настроек модулей для разных типов css
    const loaders = [
        {
            loader: MiniCssExtractPlugin.loader,
            options: {
            },
        }, 
        'css-loader', 
        'less-loader'
    ] 

    if (extra) {
        loaders.push(extra)
    }

    return loaders
    }
// функция настройки бабеля для разработки или продакшена
const babelOptions = preset => {
    const opts = {
        presets: [
            '@babel/preset-env',
            
        ]
      }

      if (preset) {
          opts.presets.push(preset)
      }

    return opts
}

const jsLoaders = () => {
    const loaders =[{
        loader: 'babel-loader',
        options: babelOptions()        
    }]


    return loaders
}

const plugins= () => {
    base = [
        new HTMLWebpackPlugin({
            template: './pages/index.pug', // путь к исходному файлу html
            minify: { // минификация кода html
                 collapseWhitespace: isProd // Если продакшн сборка, то используем
            }
        }),
        new CleanWebpackPlugin(), // плагин очистки html
        new CopyWebpackPlugin({ //копирование объектов или папок
            patterns:[ //должны быть обязательно паттерны
                 {
                     from: path.resolve(__dirname, 'src/images/favicon.ico'), //откуда копируем
                     to: path.resolve(__dirname, 'dist') //куда копируем
                 }
             ],
         }),
         new MiniCssExtractPlugin({ //указываем название файлов
             filename: filename('css')
         })
     ]

     if (isProd) {
        base.push(new BundleAnalyzerPlugin())
     }
     return base
}
 // mixins are created in file libs.pug automatically
const mixins = globule
    .find(["src/blocks/libs/**/_*.pug", "!src/blocks/libs/_libs.pug"])
    .map((path) => path.split('/').pop())
    .reduce((acc, currentItem) => acc + `include ${currentItem}\n`, ``);

fs.writeFile("src/blocks/libs/_libs.pug", mixins, (err) => {
    if (err) throw err;
    console.log('Mixins are generated automatically!')
});


module.exports = {
    context: path.resolve(__dirname, 'src'), // исходники приложения если укажем папку то далее не прописываем её в путяхз
    mode: 'development', // режим разработки
    entry: {
        'main': '/pages/index.js',
        'pages/header/header': '/blocks/header/header.js'
        // main: ['@babel/polyfill', './index.js', ],
        // header: ['@babel/polyfill', './pages/header/header.js']
         // входящие файлы js
        
    },
    output: {
        filename: filename('js'), // название выходных файлов
        path: path.resolve(__dirname, 'dist') // папке для выходных файлов
    },
    resolve: {
        extensions: ['.js', '.json', '.png', '.less', '.scss'] // разрешения, которые автоматически будет искать вебпак при импорте
        ,alias: { //указываем пути к папкам, откуда берем импорт
            '@models': path.resolve(__dirname, 'src/models'),
            '@': path.resolve(__dirname, 'src')
        }
    },
    optimization: optimization(), 
    devServer: { // настройки дев сервера
        port: 4201,
        hot: isDev
    },
    devtool: isDev ? 'inline-source-map' : false,
    plugins: plugins(),
    module: {   // подключение файлов, отличных от js, json
        rules: [
            {
                test: /\.css$/,  // выбираем тип файлов
                use: cssLoaders()
            },
            {
                test: /\.(png|jpg|svg|gif)$/,
                type: 'asset/resource'
            },
            {
                test:/\.xml$/,
                use: ['xml-loader']
            },
            {
                test: /\.csv$/,
                use: ['csv-loader']
            },
            {
                test: /\.less$/,  
                use: cssLoaders('less-loader')
            },
            {
                test: /\.s[ac]ss$/i,  
                use: cssLoaders('sass-loader')
            },
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: jsLoaders()
            },
            {
                test: /\.m?ts$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: babelOptions('@babel/preset-typescript')
                }
            },
            {
                test: /\.m?jsx$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: babelOptions('@babel/preset-react')
                }
            },
            {
                test: /\.pug$/,
                loader: 'pug-loader',
                exclude: /(node_modules|bower_components)/,
            }
        ]
    }

}