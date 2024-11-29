exports.handler = async function(event, context) {
    const sims = [
        '0IVMewI9bmdblx9Dp.html',
        '1GmwkqCxL6TON0xR5.html',
        '6Ecm8ZiLxvXaMaPPa.html',
        'CrSivpTi2y3oaIrvi.html',
        'HCcv4sJU51nHXH0TF.html',
        'NTAWuLLLxGZGLHtWy.html',
        'UBSdgM01jIszTKGS2.html',
        'qdW3MuvIJFqgsFshE.html',
        't8Spyw5CmWFsr2shx.html',
        'zsK3PBKyXbuTXvUIb.html'
    ];

    const randomSim = sims[Math.floor(Math.random() * sims.length)];
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html',
        },
        body: await fetch(`${process.env.URL}/websims/${randomSim}`).then(res => res.text())
    };
}; 