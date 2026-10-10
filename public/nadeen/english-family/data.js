// ورقة مراجعة الإنجليزي — بنفس ترتيب ورقة المعلمة.
// say: الجمل التي تُسمَع بالترتيب (إنجليزي بطيء ثم عربي). النص يجب أن يطابق سطر التسجيل.
window.SHEET = [
  { h: '1-General Questions' },
  { id: 'gqA', type: 'match', title: 'A-Match the question with the right answer :',
    inst: ['Match the question with the right answer.', 'المطلوب: صِلي السؤال بالإجابة الصحيحة.'], tip: '<bdi>Match</bdi> = صِلي 🔗',
    left: [
      { n: 1, id: 'q1', html: '<mark>How many</mark> family member do you have ?', ar: 'كم عدد أفراد عائلتك؟', pr: 'هاو ميني فاميلي ممبر دو يو هاف؟',
        hook: '🔢 <bdi>How many</bdi> = كم عدد؟ ← الجواب فيه رقم', ans: 'I have 6 family members .', arAns: 'عندي ستة أفراد في عائلتي.', prAns: 'آي هاف سِكس فاميلي ممبرز',
        say: ['How many family member do you have?', 'معناها: كم عدد أفراد عائلتك؟', 'الكلمة المهمة في أول السؤال معناها: كم عدد؟ فنبحث عن إجابة فيها رقم.', 'I have six family members.', 'معناها: عندي ستة أفراد في عائلتي.'],
        why: 'السؤال يبدأ بـ <bdi><b>How many</b></bdi> يعني «كم عدد؟»، فالإجابة لازم يكون فيها <b>رقم</b>: <bdi>I have <b>6</b> family members.</bdi>' },
      { n: 2, id: 'q2', html: '<mark>How often</mark> you visit your grand mom ?', ar: 'كم مرّة تزورين جدّتك؟', pr: 'هاو أوفن يو فيزِت يور قراند مام؟',
        hook: '🔁 <bdi>How often</bdi> = كم مرّة؟ ← الجواب فيه <bdi>always</bdi>', ans: 'We always visit her .', arAns: 'نحن نزورها دائمًا.', prAns: 'وي أولويز فيزِت هير',
        say: ['How often you visit your grand mom?', 'معناها: كم مرّةً تزورين جدّتك؟', 'الكلمة المهمة في أول السؤال معناها: كم مرّة؟ فنبحث عن إجابة فيها: دائمًا، أو عادةً، أو أبدًا.', 'We always visit her.', 'معناها: نحن نزورها دائمًا.'],
        why: 'السؤال يبدأ بـ <bdi><b>How often</b></bdi> يعني «كم مرّة؟»، فالإجابة فيها كلمة مثل <bdi><b>always</b></bdi> (دائمًا): <bdi>We <b>always</b> visit her.</bdi>' },
      { n: 3, id: 'q3', html: 'What do we call person who <mark>help others</mark>?', ar: 'ماذا نسمّي الشخص الذي يساعد الآخرين؟', pr: 'وات دو وي كول بيرسن هو هيلب أذرز؟',
        hook: '🤝 <bdi>help</bdi> = يساعد ← <bdi>helpful</bdi>', ans: 'we call him helpful .', arAns: 'نسمّيه متعاونًا، يحبّ المساعدة.', prAns: 'وي كول هِم هيلبفُل',
        say: ['What do we call person who help others?', 'معناها: ماذا نسمّي الشخص الذي يساعد الآخرين؟', 'الكلمة المهمة: يساعد الآخرين.', 'We call him helpful.', 'معناها: نسمّيه متعاونًا، يحبّ المساعدة.'],
        why: 'السؤال فيه <bdi><b>help</b></bdi> (يساعد)، والإجابة فيها نفس الكلمة: <bdi><b>help</b>ful.</bdi>' },
      { n: 4, id: 'q4', html: '<mark>Whose</mark> this book ?', ar: 'لِمَن هذا الكتاب؟', pr: 'هوز ذِس بوك؟',
        hook: '📖 <bdi>Whose</bdi> = لِمَن؟ ← الجواب: <bdi>mine</bdi> (حقّي)', ans: 'It is mine .', arAns: 'إنّه لي، هو ملكي.', prAns: 'إت إز ماين',
        say: ['Whose this book?', 'معناها: لِمَن هذا الكتاب؟', 'الكلمة المهمة في أول السؤال معناها: لِمَن؟ فنبحث عن إجابة فيها ملكيّة.', 'It is mine.', 'معناها: إنّه لي، هو ملكي.'],
        why: 'السؤال يبدأ بـ <bdi><b>Whose</b></bdi> يعني «لِمَن؟»، فالإجابة فيها ملكيّة: <bdi>It is <b>mine</b></bdi> (حقّي).' }
    ],
    right: [{ a: 3, html: 'we call him <mark>helpful</mark> .' }, { a: 4, html: 'It is <mark>mine</mark> .' }, { a: 2, html: 'We <mark>always</mark> visit her .' }, { a: 1, html: 'I have <mark>6</mark> family members .' }] },

  { id: 'gqB', type: 'match', title: 'B-Match to complete the sentence :',
    inst: ['Match to complete the sentence.', 'المطلوب: صِلي لتُكملي الجملة.'], tip: '<bdi>complete</bdi> = أكملي ✍️',
    left: [
      { n: 1, id: 's1', html: 'My dad and my mom are my ……………', ar: 'أبي وأمّي هما والداي.', pr: 'ماي داد آند ماي مام آر ماي بيرنتس', hook: '👨‍👩 بابا + ماما = <bdi>parents</bdi>', ans: 'parents.',
        say: ['My dad and my mom are my parents.', 'معناها: أبي وأمّي هما والداي.'], why: 'بابا وماما معًا اسمهما <bdi><b>parents</b></bdi> (والداي).' },
      { n: 2, id: 's2', html: 'My dad\'s brother is my ………………', ar: 'أخو أبي هو عمّي.', pr: 'ماي دادز براذر إز ماي أنكل', hook: '👨 أخو بابا (<bdi>brother</bdi>) = <bdi>uncle</bdi>', ans: 'uncle .',
        say: ['My dad\'s brother is my uncle.', 'معناها: أخو أبي هو عمّي.'], why: '<bdi><b>brother</b></bdi> يعني أخ (ولد)، وأخو بابا هو <bdi><b>uncle</b>.</bdi>' },
      { n: 3, id: 's3', html: 'My mother\'s sister is my ……………..', ar: 'أخت أمّي هي خالتي.', pr: 'ماي ماذرز سِستر إز ماي آنت', hook: '👩 أخت ماما (<bdi>sister</bdi>) = <bdi>aunt</bdi>', ans: 'aunt .',
        say: ['My mother\'s sister is my aunt.', 'معناها: أخت أمّي هي خالتي.'], why: '<bdi><b>sister</b></bdi> يعني أخت (بنت)، وأخت ماما هي <bdi><b>aunt</b>.</bdi>' }
    ],
    right: [{ a: 2, html: 'uncle .' }, { a: 3, html: 'aunt .' }, { a: 1, html: 'parents.' }] },

  { h: '2-Grammar' },
  { id: 'grA', type: 'choose', title: 'A-Choose :', inst: ['Choose.', 'المطلوب: اختاري الإجابة الصحيحة.'], tip: '<bdi>Choose</bdi> = اختاري 👆',
    items: [
      { id: 'f1', pic: '<span class="st">★★★★★</span>', opts: ['rarely', 'always'], ok: 'always', ar: 'دائمًا', pr: 'أولويز', hook: '⭐⭐⭐⭐⭐ كل النجوم = <bdi>always</bdi>',
        say: ['Always.', 'دائمًا: كلَّ مرّة، خمسُ نجوم من خمس.'], why: 'خمس نجوم من خمس = كلّ مرّة = <bdi><b>always</b>.</bdi> أما <bdi>rarely</bdi> فمعناها «نادرًا».' },
      { id: 'f2', pic: '<span class="st">★★★</span><span class="xx">✖✖</span>', opts: ['usually', 'always'], ok: 'usually', ar: 'عادةً', pr: 'يوجوالي', hook: '⭐⭐⭐✖✖ أغلبها نجوم = <bdi>usually</bdi>',
        say: ['Usually.', 'عادةً: أغلبَ المرّات، ثلاثُ نجوم.'], why: 'فيها ✖ يعني مو كل مرّة، لكن أغلبها نجوم = <bdi><b>usually</b></bdi> (عادةً).' },
      { id: 'f3', pic: '<span class="xx">✖✖✖✖</span>', opts: ['never', 'usually'], ok: 'never', ar: 'أبدًا', pr: 'نيفر', hook: '✖✖✖✖ ولا نجمة = <bdi>never</bdi>',
        say: ['Never.', 'أبدًا: ولا مرّة، كلُّها علاماتُ خطأ.'], why: 'كلّها ✖ ولا نجمة = ولا مرّة = <bdi><b>never</b></bdi> (أبدًا).' }
    ] },

  { id: 'grB', type: 'match', title: 'B-Match pronouns to their possessive pronouns:', small: true,
    inst: ['Match pronouns to their possessive pronouns.', 'المطلوب: صِلي كل ضمير بضمير الملكية الذي يناسبه.'], tip: '<bdi>pronoun</bdi> = ضمير 🙋‍♀️',
    left: [
      { n: 1, id: 'p1', html: 'I', ar: 'أنا ← لي', pr: 'آي ← ماين', hook: '🙋‍♀️ I ← <bdi>mine</bdi>', ans: 'mine .', say: ['I. Mine.', 'أنا، لي.'], why: '<b>I</b> (أنا) ← <bdi><b>mine</b></bdi> (لي، حقّي). كلاهما فيهما حرف <bdi>i.</bdi>' },
      { n: 2, id: 'p2', html: 'you', ar: 'أنتِ ← لكِ', pr: 'يو ← يور', hook: '👉 <bdi>you</bdi> ← <bdi>your</bdi> (نفس البداية <bdi>you</bdi>)', ans: 'your .', say: ['You. Your.', 'أنتِ، لكِ.'], why: '<bdi><b>you</b></bdi> ← <bdi><b>your</b></bdi>: نفس الحروف <bdi>you</bdi> وزيادة <bdi>r.</bdi>' },
      { n: 3, id: 'p3', html: 'He', ar: 'هو ← له', pr: 'هي ← هِز', hook: '👦 <bdi>He</bdi> ← <bdi>his</bdi> (الاثنتان تبدأ بـ h)', ans: 'his .', say: ['He. His.', 'هو، له.'], why: '<bdi><b>He</b></bdi> (هو، ولد) ← <bdi><b>his</b>.</bdi> الاثنتان تبدأ بحرف <bdi>h.</bdi>' },
      { n: 4, id: 'p4', html: 'She', ar: 'هي ← لها', pr: 'شي ← هير', hook: '👧 <bdi>She</bdi> ← <bdi>her</bdi> (للبنت)', ans: 'her .', say: ['She. Her.', 'هي، لها.'], why: '<bdi><b>She</b></bdi> (هي، بنت) ← <bdi><b>her</b>.</bdi> و<bdi>his</bdi> للولد.' },
      { n: 5, id: 'p5', html: 'We', ar: 'نحن ← لنا', pr: 'وي ← آور', hook: '👨‍👩‍👧 <bdi>We</bdi> ← <bdi>our</bdi> (نحن)', ans: 'our .', say: ['We. Our.', 'نحن، لنا.'], why: '<bdi><b>We</b></bdi> (نحن) ← <bdi><b>our</b></bdi> (لنا).' },
      { n: 6, id: 'p6', html: 'They', ar: 'هم ← لهم', pr: 'ذَي ← ذيرز', hook: '👥 <bdi>They</bdi> ← <bdi>theirs</bdi> (الاثنتان تبدأ بـ <bdi>the</bdi>)', ans: 'theirs.', say: ['They. Theirs.', 'هم، لهم.'], why: '<bdi><b>They</b></bdi> ← <bdi><b>theirs</b></bdi>: الاثنتان تبدأ بـ <bdi><b>the</b>.</bdi>' }
    ],
    right: [{ a: 6, html: 'theirs.' }, { a: 5, html: 'our .' }, { a: 4, html: 'her .' }, { a: 3, html: 'his .' }, { a: 2, html: 'your .' }, { a: 1, html: 'mine .' }] },

  { h: '3-Vocabulary' },
  { id: 'voA', type: 'write', title: 'A-Write the correct word under pictures :', bank: ['cycling', 'fishing', 'cook pizza', 'go to the beach'],
    inst: ['Write the correct word under pictures.', 'المطلوب: اكتبي الكلمة الصحيحة تحت الصورة.'], tip: '<bdi>Write</bdi> = اكتبي ✏️ ‏· <bdi>picture</bdi> = صورة 🖼️',
    items: [
      { id: 'v1', img: 'fishing', ok: 'fishing', ar: 'صيد السمك', pr: 'فِشِنق', hook: '🎣 <bdi>fish</bdi> = سمكة ← <bdi>fishing</bdi>', say: ['Fishing.', 'صيدُ السمك.'], why: 'في الصورة صنّارة وسمكة 🎣 = <bdi><b>fishing</b>.</bdi>' },
      { id: 'v2', img: 'beach', ok: 'go to the beach', ar: 'الذهاب إلى الشاطئ', pr: 'قو تو ذا بيتش', hook: '🏖️ سطل ومجرفة وعوّامة = <bdi>beach</bdi>', say: ['Go to the beach.', 'الذهابُ إلى الشاطئ.'], why: 'معه سطل ومجرفة وعوّامة 🏖️ = <bdi><b>go to the beach</b>.</bdi>' },
      { id: 'v3', img: 'cycling', ok: 'cycling', ar: 'ركوب الدرّاجة', pr: 'سايكلِنق', hook: '🚲 <bdi>cycle</bdi> = دراجة ← <bdi>cycling</bdi>', say: ['Cycling.', 'ركوبُ الدرّاجة.'], why: 'يركب درّاجة 🚲 = <bdi><b>cycling</b>.</bdi>' }
    ],
    extra: { w: 'cook pizza', say: ['Cook pizza.', 'طبخُ البيتزا.'], ar: 'طبخ البيتزا', pr: 'كوك بيتزا' } },

  { id: 'voB', type: 'choose', title: 'A-Read and choose :', pics: true, inst: ['Read and choose.', 'المطلوب: اقرئي واختاري الكلمة التي تناسب الصورة.'], tip: '<bdi>Read</bdi> = اقرئي 👀 ‏· <bdi>choose</bdi> = اختاري 👆',
    items: [
      { id: 'r1', img: 'strong', opts: ['strong', 'weak'], ok: 'strong', ar: 'قويّ', pr: 'سترونق', hook: '💪 عضلات = <bdi>strong</bdi>', say: ['Strong.', 'قويّ.'], other: { weak: ['Weak.', 'ضعيف.'] }, why: 'يرفع الحديد بعضلاته 💪 = <bdi><b>strong</b></bdi> (قويّ). أما <bdi>weak</bdi> فمعناها ضعيف.' },
      { id: 'r2', img: 'helping', opts: ['lazy', 'helpful'], ok: 'helpful', ar: 'متعاون', pr: 'هيلبفُل', hook: '🤝 يمدّ يده ويساعد = <bdi>helpful</bdi>', say: ['Helpful.', 'متعاون.'], other: { lazy: ['Lazy.', 'كسول.'] }, why: 'يمدّ يده ويساعد صديقه 🤝 = <bdi><b>helpful</b>.</bdi> أما <bdi>lazy</bdi> فمعناها كسول.' },
      { id: 'r3', img: 'grandparents', opts: ['grandparents', 'son'], ok: 'grandparents', ar: 'الجدّ والجدّة', pr: 'قراندبيرنتس', hook: '👴👵 <bdi>grand</bdi> = كبير ← <bdi>grandparents</bdi>', say: ['Grandparents.', 'الجدُّ والجدّة.'], other: { son: ['Son.', 'ابن.'] }, why: 'رجل كبير وامرأة كبيرة 👴👵 = <bdi><b>grandparents</b>.</bdi> أما <bdi>son</bdi> فمعناها ابن.' },
      { id: 'r4', img: 'lazy', opts: ['kind', 'lazy'], ok: 'lazy', ar: 'كسول', pr: 'ليزي', hook: '🛋️ نايم على الكنبة = <bdi>lazy</bdi>', say: ['Lazy.', 'كسول.'], other: { kind: ['Kind.', 'لطيف.'] }, why: 'نايم على الكنبة وما يشتغل 🛋️ = <bdi><b>lazy</b></bdi> (كسول). أما <bdi>kind</bdi> فمعناها لطيف.' },
      { id: 'r5', img: 'tired', opts: ['tired', 'chatty'], ok: 'tired', ar: 'متعب', pr: 'تايرد', hook: '🪫 البطارية فاضية = <bdi>tired</bdi>', say: ['Tired.', 'متعب.'], other: { chatty: ['Chatty.', 'كثيرُ الكلام.'] }, why: 'فوقها بطارية فاضية 🪫 = <bdi><b>tired</b></bdi> (متعبة). أما <bdi>chatty</bdi> فمعناها كثير الكلام.' }
    ] },

  { h: '4-Orthography' },
  { id: 'orA', type: 'choose', title: 'A-Choose the correct spelling.', pics: true, spell: true, inst: ['Choose the correct spelling.', 'المطلوب: اختاري الكتابة الصحيحة للكلمة.'], tip: '<bdi>spelling</bdi> = طريقة كتابة الكلمة 🔤',
    items: [
      { id: 'o1', img: 'bus', opts: ['bus', 'bas'], ok: 'bus', ar: 'حافلة (باص)', pr: 'باص', hook: '🚌 <bdi>B-U-S</bdi>: الحرف الأوسط u', say: ['Bus. B, U, S. Bus.', 'حافلة، أو باص.'], why: 'تُكتب <bdi><b>b-u-s</b></bdi> بحرف <b>u</b> في الوسط، مو <bdi>a.</bdi>' },
      { id: 'o2', img: 'pizza', opts: ['bike pizza', 'bake pizza'], ok: 'bake pizza', ar: 'نخبز البيتزا', pr: 'بيك بيتزا', hook: '🍕 <bdi>bake</bdi> = نخبز ‏· <bdi>bike</bdi> = درّاجة 🚲', say: ['Bake pizza. B, A, K, E. Bake pizza.', 'نخبزُ البيتزا.'], why: '<bdi><b>bake</b></bdi> بحرف a يعني نخبز 🍕. أما <bdi>bike</bdi> بحرف i فمعناها درّاجة 🚲.' },
      { id: 'o3', img: 'shy', opts: ['shy', 'shay'], ok: 'shy', ar: 'خجول', pr: 'شاي', hook: '🙈 <bdi>S-H-Y</bdi> ثلاثة حروف فقط', say: ['Shy. S, H, Y. Shy.', 'خجول.'], why: 'تُكتب <bdi><b>s-h-y</b></bdi> ثلاثة حروف فقط، بدون <bdi>a.</bdi>' },
      { id: 'o4', img: 'chatty', opts: ['shatty', 'chatty'], ok: 'chatty', ar: 'كثير الكلام', pr: 'تشاتي', hook: '💬 تبدأ بـ <bdi>ch</bdi> مثل <bdi>chat</bdi> (سوالف)', say: ['Chatty. C, H, A, T, T, Y. Chatty.', 'كثيرُ الكلام.'], why: 'صوت «تش» يُكتب <bdi><b>ch</b></bdi>: <bdi><b>ch</b>atty</bdi>، مثل <bdi>chat</bdi> (سوالف).' }
    ] },

  { id: 'orB', type: 'copy', title: 'B- Copy:', inst: ['Copy.', 'المطلوب: انسخي الجملة بخطٍّ واضح ومرتّب.'], tip: '<bdi>Copy</bdi> = انسخي 📝',
    item: { id: 'c1', text: 'I like my family', ar: 'أنا أحبّ عائلتي.', pr: 'آي لايك ماي فاميلي', hook: '❤️ I كبيرة دائمًا، ومسافة بين كل كلمة',
      say: ['I like my family.', 'معناها: أنا أحبُّ عائلتي.', 'تذكّري: الحرفُ الأوّلُ في الجملة كبير، ونتركُ مسافةً بين كلِّ كلمةٍ وكلمة.'], spellSay: ['Family. F, A, M, I, L, Y. Family.'] } }
];
