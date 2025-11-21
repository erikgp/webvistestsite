/*
 * Functions for calculation of bmi, gfr etc
 * For all functions to calculate gfr from kreat or cyst c there are function wrappers, all with the same interface
 * and returning the same kind of values (agfr, rgfr, and body surface area).
 * (The same function signature...)
 * Not all arguments are used in the wrappers
 * All methods return [agfr, rgfr, body_area]
 * Thus a function "pointer" to any of the function wrappers can be used to select method to calc gfr.
 *
 * All wrappers have the following signature:
 *    Arg1: age (years)  (float)
 *    Arg2: weight (kg)  (float)
 *    Arg3: height (cm)  - for body area
 *    Arg4: kreat (umol/L) (float)
 *    Arg5: sex (female = 0, male = 1) (integer)
 *    Arg6: etnicity (1 == afroamerican, when used)
 *    Returns [aGFR (ml/min), rGFR (ml/(min*1,73 m2), body area (m2))
 *
 * function wr_*(age, vikt, langd, kreat, sex, etn = 0) { ...; return [agfr, rgfr, ky]; }
 *
 *
 * Should probably fix the wrappers...
 * Generally better to have ONE wrapper function with parameters...
 */

'use strict';


/*
 * Calculate BMI.
 * NO input validation
 * Arg1: mass, in kg  (int, float)
 * Arg2: height, in cm (int, float)
 *
 * Returns: bmi as kg/(m^2)
 */
function calc_bmi(m, h) {
    return (m/(h*h)) * 10000.0;
}


/*
 * Lean body mass according to Boer
 * NO input validation
 * Arg1: weight (kg)   (float)
 * Arg2: length (cm)   (float)
 * Arg3: sex  (female = 0, male = 1)  (integer)
 *
 * Returns lean body mass (kg)
 */
function lean_body_mass(vikt, langd, sex) {
    if (sex == 0) {
        return 0.252 * vikt + 0.473 * langd - 48.3;
    }
    else if (sex == 1) {
        return 0.407 * vikt + 0.267 * langd - 19.2;
    }
    else
        return -1;
}


/*
 * Calculates Ideal body weight according to Devine (Devine BJ. Gentamicin therapy. DICP. 1974; 8:650–5.)
 * https://www.bmi-calculator.net/ideal-weight-calculator/devine-formula/
 * Men: Ideal Body Weight (kg) = 50 kg + 2.3 kg per inch over 5 feet.
 * Women: Ideal Body Weight (kg) = 45.5 kg + 2.3 kg per inch over 5 feet.
 * Arg1: length (cm)   (float)
 * Arg2: sex  (female = 0, male = 1) (integer)
 * 
 * Returns: ideal body weight (kg)
 */
function ibw_devine(langd, sex) {
    const cmperfeet = 30.48;     // 30.48 cm/ft
    const cmperinch = 2.54;      // 2.54 cm/inch
    langd = langd - 30.48 * 5;

    if (sex == 0) {
        return 45.5 + 2.3 * (langd/cmperinch);
    }
    else {
        return 50.0 + 2.3 * (langd/cmperinch);
    }
}


/*
 * Calculates body area according to du Bois and du Bois.
 * NO input validation
 * Arg1: mass, in kg  (int, float)
 * Arg2: height, in cm (int, float)
 *
 * Returns: body area (m^2)
 */
function calc_kroppsyta(m, h) {
    const ky = (m**0.425 * h**0.725) * 0.007184;
    return ky;
}


/*
 * Function to calculate [kreatinine]  in umol/L from [kreatinine] in mg/dl
 * NO input validation
 * Arg1: kreatinine konc   (mg/dl)   (float)
 *
 * Returns: kreatinine konc  (umol/L)  (float)
 */
function creat_konc_conv(kreat) {
    const mw = 113.120;   // g*mol^(-1)
    // kreat (umol/L) = kreat (mg/dl) / 1000 (mg/g) * 10 (dl/L) / mw (g/mol) * 1000000 (umol/mol) = kreat (mg/dl) * 10000 / mw (g/mol) 
    return kreat * 10000 / mw;
}



/*
 * aGFR (absolute GFR) according to Cockcroft Gault from Creatinine
 * NO input validation
 * NOT VALIDATED
 * Arg1: age (years)  (float)
 * Arg2: weight (kg)  (float)
 * Arg3: kreat (umol/L) (float)
 * Arg4: sex (female = 0, male = 1) (integer)
 *
 * Returns aGFR (ml/min)
 */
function agfr_cockgault(age, vikt, kreat, sex) {
    const agfr = 1.23 * (( 140 - age) * vikt/kreat) * (1 - sex) * 0.85;
    return agfr;
}


/*
 * aGFR (absolute GFR) according to Cockcroft Gault from Creatinine
 * WRAPPER
 */
function wr_agfr_cockgault(age, vikt, langd, kreat, sex, etn = 0) {
    const agfr = agfr_cockgault(age, vikt, kreat, sex);
    const ky = calc_kroppsyta(vikt, langd);
    return [agfr, agfr_to_rgfr(agfr, ky), ky];
}


/*
 * aGFR (absolute GFR) according to Lund-Malmö with lean body mass, from Creatinine
 * NO input validation
 * Arg1: age (years)   (float)
 * Arg2: lbm (kg)      - lean body mass enl Boer (float)
 * Arg3: kreat (umol/L)  (float)
 *
 * Returns aGFR (ml/min)
 */
function agfr_lm(age, lbm, kreat) {
    let x = 0.0;
    if (kreat < 150) {
        x = -0.0111 * kreat;
    }
    else {
        x = 3.55 + 0.0004 * kreat - 1.07 * Math.log(kreat);
    }
    return Math.exp(x - 0.0128*age + 0.387 * Math.log(age) + 1.10 * Math.log(lbm));
} 


/*
 * aGFR (absolute GFR) according to Lund-Malmö with lean body mass, from Creatinine
 * WRAPPER
 */
function wr_agfr_lm(age, vikt, langd, kreat, sex, etn=0) {
    const agfr = agfr_lm(age, lean_body_mass(vikt, langd, sex), kreat);
    const ky = calc_kroppsyta(vikt, langd);
    return [agfr, agfr_to_rgfr(agfr, ky), ky];
} 



/*
 * rGFR (realtive GFR) according to MDRD-IDMS, from Creatinine
 * NO input validation
 * NOT VALIDATED
 * First version of MDRD used the constant 186 instead of 175, as below.
 * Arg1: age (years)   (float)
 * Arg2: kreat (umol/L)  (float)
 * Arg3: sex (female = 0, male = 1)  (integer)
 * Arg4: etnicity  (1 for afroamerican, 0 otherwise) - default = 0  (integer) !!!! What about africans?
 *
 * Returns rGFR (ml/(min*1,73 m2)
 */
function rgfr_mdrd(age, kreat, sex, etn = 0) {
    let x = 175.0 * (kreat / 88.4)**(-1.154) * age**(-0.203);
    if (sex == 0) x = x * 0.742;
    if (etn == 1) x = x * 1.210;
    return x;
}


/*
 * rGFR (realtive GFR) according to MDRD-IDMS, from Creatinine
 * WRAPPER
 */
function wr_rgfr_mdrd(age, vikt, langd, kreat, sex, etn=0) {
    const x = rgfr_mdrd(age, kreat, sex, etn);
    const ky = calc_kroppsyta(vikt, langd);
    return [ rgfr_to_agfr(x, ky), x, ky];
}


/*
 * rGFR (relative GFR) accoding to CKD-EPI_krea, from creatinine
 * NO input validation
 * NOT VALIDATED
 * Arg1: age (years)   (float)
 * Arg2: kreat (umol/L)  (float)
 * Arg3: sex (female = 0, male = 1)  (integer)
 * Arg4: etnicity  (1 for afroamerican, 0 otherwise) - default = 0  (integer) !!!! What about africans?
 *
 * Returns rGFR (ml/(min*1,73 m2)
 */
function rgfr_ckd_kreat(age, kreat, sex, etn = 0) {
    let x = -1;
    if (sex == 0) {  // female
        if (kreat <= 62) {
            x = 144 * (kreat / 62)**(-0.329) * 0.993**age;
        }
        else {
            x = 144 * (kreat / 62)**(-1.209) * 0.993**age;
        }
    }
    else if (sex == 1 ) { // male
        if (kreat <= 80) {
            x = 141 * (kreat/80)**(-0.411) * 0.993**age;
        }
        else {
            x = 141 * (kreat/80)**(-1.209) * 0.993**age;
        }
    }

    if (etn == 1) x *= 1.159;

    return x;
}


/*
 * rGFR (relative GFR) accoding to CKD-EPI_krea, from creatinine
 * WRAPPER
 */
function wr_rgfr_ckd_kreat(age, vikt, langd, kreat, sex, etn=0) {
    const x = rgfr_ckd_kreat(age, kreat, sex, etn);
    const ky = calc_kroppsyta(vikt, langd);
    return [ rgfr_to_agfr(x, ky), x, ky];
}


/*
 * rGFR (relative GFR) according to CAPA, from cystatine C
 * NO input validation
 * NOT VALIDATED
 * Arg1: age (years)   (float)
 * Arg2: cystatin c  (mg/L)   (float)
 *
 * Returns rGFR (ml/(min*1,73 m2)
 */
function rgfr_capa(age, cysc) {
    const x = 130 * cysc**(-1.069) * age**(-0.117) - 7.0;
    return x;
}


/*
 * rGFR (relative GFR) according to CAPA, from cystatine C
 * WRAPPER
 */
function wr_rgfr_capa(age, vikt, langd, cysc, sex = 0, etn = 0) {
    const x = rgfr_capa(age, cysc);
    const ky = calc_kroppsyta(vikt, langd);
    return [ rgfr_to_agfr(x, ky), x, ky];
}


/*
 * rGFR (relative GFR) according to CKD-EPI_cysc, from plasma cystatine c
 * NO input validation
 * NOT VALIDATED
 * Arg1: age (years)   (float)
 * Arg2: cystatine c   (mg/L)    (float)
 * Arg3: sex (female = 0, male = 1)
 *
 * Returns rGFR (ml/(min*1,73 m2)
 */
function rgfr_ckd_cysc(age, cysc, sex) {
    let x = 0;
    if (cysc <= 0.8) {
        x = 133 * (cysc/0.8)**(-0.499) * 0.996**age;
    }
    else {
        x = 133 * (cysc/0.8)**(-1.328) * 0.996**age;
    }

    if ( sex == 0) x *= 0.932;

    return x;
}



/*
 * rGFR (relative GFR) according to CKD-EPI_cysc, from plasma cystatine c
 * WRAPPER
 */
function wr_rgfr_ckd_cysc(age, vikt, langd, cysc, sex, etn = 0) {
    const x = rgfr_ckd_cysc(age, cysc, sex);
    const ky = calc_kroppsyta(vikt, langd);
    return [ rgfr_to_agfr(x, ky), x, ky];
}




/*
 * rGFR (relative GFR) from plasma Kreatinin: revised Lund-Malmö method
 * NO input validation
 * Arg1: age (years)   (float)
 * Arg2: kreat (umol/L)  (float)
 * Arg3: sex (female = 0, male = 1)  (integer)
 *
 * Returns rGFR (ml/(min*1,73 m2)
 */
function rgfr_revlm(age, kreat, sex) {
    let x = 0;
    if (sex == 1) {  // man
        if (kreat < 180.0) {
            x = 2.56 + 0.00968 * (180.0 - kreat);
        }
        else {
            x = 2.56 - 0.926 * Math.log(kreat / 180.0);
        }
    }
    else { // kvinna
        if (kreat < 150.0) {
            x = 2.50 + 0.0121 * (150.0 - kreat)
        }
        else {
            x = 2.50 - 0.926 * Math.log(kreat / 150)
        }
    }
    // rGFR = ml/(min*1.73 m^2)
    const temp_rgfr = Math.exp(x - 0.0158 * age + 0.438 * Math.log(age));

    return temp_rgfr;
}



/*
 * rGFR (relative GFR) from plasma Kreatinin: revised Lund-Malmö method
 * WRAPPER
 */
function wr_rgfr_revlm(age, vikt, langd, kreat, sex, e=0) {
    const temp_rgfr = rgfr_revlm(age, kreat, sex);
    const ky = calc_kroppsyta(vikt, langd);
    return [ rgfr_to_agfr(temp_rgfr, ky), temp_rgfr, ky];
}


/*
 * Calculates aGFR from rGFR
 * Does NOT check for correct type of arguments
 * Arg 1: rGFR (ml/(min*1,73m^2)    (float)
 * Arg 2: body area (m^2)           (float)
 *
 * Returns: aGFR (ml/min)
 */
function rgfr_to_agfr(rgfr, ky) {
    // rGFR = aGFR/kroppsyta*1.73  ==> aGFR = rGFR*ky/1.73
    return rgfr * ky / 1.73;
}


/*
 * Calculates rGFR from aGFR
 * Does NOT check for correct type of arguments
 * Arg 1: aGFR (ml/(min)      (float)
 * Arg 2: body area (m^2)     (float)
 *
 * Returns: rGFR (ml/(min*1,73m^2)
 */
function agfr_to_rgfr(agfr, ky) {
    return agfr * 1.73 / ky;
}


/*
 * Calculates a children and adolescents, a fixed creatinine can be calculated and then
 * used in the formulas above, but with setting the age to 18 and using the fixed creatinine.
 *
 * Att användas med den revidera Lund-Malmö-metoden (rgfr_revlm)
 *
 * För barn och ungdomar under 18 år används nedanstående formler för att omvandla deras 
 * kreatininvärde till motsvarande värde vid 18 års ålder, vilket då används för att beräkna 
 * eGFR tillsammans med ålder 18 år [23]
 *
 * Pojkar:
 * ln(justerat kreatinin) = ln(kreatinin) + 0,259 x (18 - ålder) - 0,543 x ln(18 / ålder) - 0,00763 x (18^2 - ålder^2) + 0,0000790 x (18^3 - ålder^3)
 * Flickor:
 * ln(justerat kreatinin) = ln(kreatinin) + 0,177 x (18 - ålder) - 0,223 x ln(18 / ålder) - 0,00596 x (18^2 - ålder^2) + 0,0000686 x (18^3 - ålder^3)
 *
 * Source: https://egfr.se/
 * Nyman U, Berg U, Grubb A, Larsson A, Hansson M, Littmann K, Åsling-Monemi K, Björk J.
 * Så kan formel för vuxna skatta glomerulär filtration hos barn. Läkartidningen. 2021;118:20134 Lakartidningen.se 2021-06-21
 *
 *
Fakta 1. Formler för att omvandla ett barns (<18 år) plasmakreatininvärde till motsvarande värde vid 18 års ålder
ln är den naturliga logaritmen, Kr är barnets faktiska kreatininvärde (μmol/l), 
Ålder (år) är barnets aktuella ålder och Kr* är det åldersjusterade kreatininvärdet vid 18 års ålder [11]: 

Pojkar:
ln(Kr*) = ln(Kr) + 0,259 × (18 – Ålder) – 0,543 × ln(18 / Ålder) – 0,00763 × (18^2 – Ålder^2) + 0,0000790 × (18^3 – Ålder^3)
Flickor:
ln(Kr*) = ln(Kr) + 0,177 × (18 – Ålder) – 0,223 × ln(18 / Ålder) – 0,00596 × (18^2 – Ålder^2) + 0,0000686 × (18^3 – Ålder^3)

Exempel
Plasmakreatinin 60 μmol/l hos en 10-årig flicka skulle vid 18 års ålder motsvara 79 μmol/l:
ln(Kr*) = ln(60) + 0,177 × (18 – 10) – 0,223 × ln(18 / 10) – 0,00596 × (182 – 102) + 0,0000686 × (183 – 103) ≈ 4,3757; e4,3757 ≈ 79 μmol/l

Med denna justering kan den reviderade Lund–Malmö-formeln [7] användas för både barn och vuxna då Kr* = det verkliga kreatininvärdet för individer ≥18 år:
LMR18 =e^(x – 0,0158 * max(Ålder; 18) + 0,438 * ln(max(Ålder; 18))
Flickor Kr* < 150 μmol/l: x = 2,50 + 0,0121 × (150 – Kr*) 
Flickor Kr* ≥ 150 μmol/l: x = 2,50 – 0,926 × ln(Kr* / 150) 
Pojkar Kr* < 180 μmol/l:  x = 2,56 + 0,00968 × (180 – Kr*)
Pojkar Kr* ≥ 180 μmol/l:  x = 2,56 – 0,926 × ln(Kr* / 180)

där max (Ålder; 18) representerar den högsta åldern av individens verkliga ålder och 18 år, 
det vill säga att i formeln används 18 år för barn och verklig ålder för vuxna.
 *
 * Arg1: age (years)  (float)   - should be < 18
 * Arg2: kreatining (umol/L)  (float)
 * Arg3: sex  (female = 0, male = 1)
 *
 * Returns: adjusted kreat (umol/L)
 */
function rev_kreat_child(age, kreat, sex) {
    if (age < 0 || age > 18) return 1000;  // return extreme value!!!

    let x = 0;
    if (sex == 0) { // female
        x = Math.log(kreat) + 0.177 * (18.0 - age) - 0.223 * Math.log(18.0 / age) - 0.00596 * (18**2 - age**2) + 0.0000686 * (18**3 - age**3);
    }
    else {
        x = Math.log(kreat) + 0.259 * (18.0 - age) - 0.543 * Math.log(18.0 / age) - 0.00763 * (18**2 - age**2) + 0.0000790 * (18**3 - age**3);
    }

    return Math.exp(x);
}



