/*
 * Denna fil innehåller protokollspecifika funktioner.
 * Alla funktioner ska ha samma signatur, och ska sålunda ta samma argument nämligen:
 * Arg1: ett html element (där tanken är att detta ska användas för output)
 * Arg2: ett resultatobject såsom def i gfr.js
 * Arg3: ett protokolobject såsom definierat i protokoll_data.js
 * Arg4: ett pd_objekt, vilket innehåller motsvarande innehållet i pd formen i prot.js/kontrast.html, dvs med följande members:
 *          weight (int), height (int), bmi (float), agfr (float), rgfr (float), varav vissa kan vara NaN
 * Arg5: ett pf objekt, vilket innehåller motsvarande innehållet i pf form, frånsett framräknade värden, dvs med följande members (alla som int):
 *          dos, konc, tid, maxvikt, varav vissa kan vara NaN
 *
 * Funktionerns ska inte returnera något
 */

function pfunc_two_injections(e, resultat, pr, pd_obj, pf_obj) {
    const inj1_tid = pr.pfunc_args.inj1_time;
    const inj2_tid = pr.pfunc_args.inj2_time;
    const inj1_prop = pr.pfunc_args.inj1_ratio;
    const inj2_prop = pr.pfunc_args.inj2_ratio;

    const vikt = Math.min(pd_obj.weight, pf_obj.maxvikt);
    const vol = Math.round(vikt * pf_obj.dos / pf_obj.konc);

    // const inj1_vol = Math.floor(vol * inj1_prop);
    const inj1_vol = Math.round(vol * inj1_prop);
    const inj1_injh = (inj1_vol / inj1_tid).toFixed(1);

    // const inj2_vol = Math.ceil(vol * inj2_prop);
    const inj2_vol = Math.round(vol * inj2_prop);
    const inj2_injh = (inj2_vol / inj2_tid).toFixed(1);

    let utstr = "<br/><b>Extra information</b><br/>Total kontrastmängd, " + vol + " ml, koncentration " + pf_obj.konc + " mg I/ml, ";
    utstr += "ska delas upp på 2 injektioner enligt ovan.<br/><br/>";
    utstr += "<b>Inj 1</b>: Volym: " + (inj1_prop*100) + " % =<span class='hl'> " + inj1_vol + " ml, " + inj1_tid + " s</span>, Injektionshastighet: " + inj1_injh + " ml/s<br/><br/>";
    utstr += "<b>Inj 2</b>: Volym: " + (inj2_prop*100) + " % =<span class='hl'> " + inj2_vol + " ml, " + inj2_tid + " s</span>, Injektionshastighet: " + inj2_injh + " ml/s";
    e.innerHTML = utstr;
}

