module.exports = {
    mode: "development",
    entry: `${__dirname}/src/index.js`,
    output: {
        path: `${__dirname}/dist`,
        filename: "bundle.js"
    },
    devServer: {
        port: 8888,
        contentBase: `${__dirname}/dist`
    },
    module: {
        rules: [
            {
                test: /\.js$/,
            },
            {
                test: /\.(png|jpe?g)$/,
                loader: "file-loader",
                options: {
                    name(path, query) {
                        if(process.env.NODE_ENV === "development") 
                            return "[path][name].[ext]";
                        else 
                            return "[contenthash].[ext]";
                    },
                },
            }
        ]
    }
}