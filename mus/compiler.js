//
// Jedd Haberstro
//

function max(a, b) { return (a > b) ? a : b; }

var endTime = function (time, expr) {
    if (expr.tag == 'seq') {
        return time + endTime(0, expr.left) + endTime(0, expr.right);
    }
    else if (expr.tag == 'par') {
      return time + max(endTime(0, expr.left), endTime(0, expr.right));
    }
    else if (expr.tag == "repeat") {
        return time + (endTime(0, expr.section) * expr.count);
    }
    else {
        return time + expr.dur;
    }
};

var convertPitch = function(pitch) {
    pitches = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
    letterPitchLookup = {};
    for (var i = 0; i < pitches.length; ++i) {
        letterPitchLookup[pitches[i]] = i;
    }
    
    var l = pitch.length;
    var octave = pitch[l-1];
    var letter = pitch.substr(0, l-1);
    return 12 + 12 * octave + letterPitchLookup[letter];
};

var compile = function (musexpr) {  
    var time = 0;
    var notes = [];
    var exprStack = [musexpr];
    while (exprStack.length) {
        var cur = exprStack.pop();
        if (cur.tag == 'seq') {
            exprStack.push(cur.right);
            exprStack.push(cur.left);
        }
        else if (cur.tag == 'par') {
            var leftNotes = compile(cur.left);
            var rightNotes = compile(cur.right);
            var parNotes = [];
            for (var i = 0, j = 0; i < leftNotes.length || j < rightNotes.length;) {
                if (i < leftNotes.length && j < rightNotes.length) {
                    if (leftNotes[i].start <= rightNotes[j].start) {
                        parNotes.push(leftNotes[i++]);
                    }
                    else {
                        parNotes.push(rightNotes[j++]);
                    }
                }
                else if (i < leftNotes.length) {
                    parNotes.push(leftNotes[i++]);
                }
                else {
                    parNotes.push(rightNotes[j++]);
                }
                
                parNotes[parNotes.length - 1].start = time;
            }
                    
            if (parNotes.length > 0) {
                time += endTime(0, cur);
                for (var k = 0; k < parNotes.length; ++k) { notes.push(parNotes[k]); }
            }
        }
        else if (cur.tag == "note") {
            notes.push({tag:'note', pitch:convertPitch(cur.pitch), start:time, dur:cur.dur});
            time += cur.dur;
        }
        else if (cur.tag == "rest") {
            notes.push({tag:'note', start:time, dur:cur.dur});
            time += cur.dur;
        }
        else if (cur.tag == "repeat") {
            if (cur.count > 0) {
                var repeatedNotes = compile(cur.section);
                var repeatedNotesDur = endTime(0, cur.section)
                for (var i = 0; i < cur.count; ++i) {
                    for (var j = 0; j < repeatedNotes.length; ++j) {
                        notes.push({tag:"note", pitch:repeatedNotes[j].pitch, start:(repeatedNotes[j].start + time), dur:repeatedNotes[j].dur});
                    }
                    time += repeatedNotesDur;
                }
            }
        }
    }
    
    return notes;
};

var melody_mus =
{
    tag: 'repeat',
    section:
    {
        tag:"seq",
        left:  {tag:"note", pitch:"a4", dur:100},
        right: {tag:"note", pitch:"b4", dur:200}
    },
    count: 3
}

//console.log(melody_mus);
console.log(compile(melody_mus));