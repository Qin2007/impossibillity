import { Devvit, useState, useAsync, useForm } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Add a menu item to the subreddit menu for instantiating the new experience post
Devvit.addMenuItem({
  label: 'create Quizpost',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    ui.showToast("Submitting your post - upon completion you'll navigate there.");

    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: `Snoovatar (${context.appVersion})`,
      subredditName: subreddit.name,
      // The preview appears while the post loads
      preview: create_preview(context.appVersion),
    });
    ui.navigateTo(post);
  },
});

function create_preview(appVersion: string) {
  const disabled = true;
  return (
    <vstack height="100%" width="100%" gap="medium" alignment="center middle">
      <text>Ask A Question!</text>
      <hstack gap="medium">
        <button appearance="primary" disabled={disabled}>
          Top Left Answer
        </button>
        <button appearance="primary" disabled={disabled}>
          Top Right Answer
        </button>
      </hstack>
      <hstack gap="medium">
        <button appearance="primary" disabled={disabled}>
          Bottom Left Answer
        </button>
        <button appearance="primary" disabled={disabled}>
          Bottom Right Answer
        </button>
      </hstack>

      <hstack gap="medium">
        <button appearance="destructive" disabled={disabled}>
          i give up
        </button>
        <button appearance="bordered" disabled={true}>Create my own Quiz</button>
      </hstack>
      <text>(appV=&quot;{appVersion}&quot;)</text>
    </vstack>
  );
}
/*for i in 'Top Left,Top Right,Bottom Left,Bottom Right'.split(','):
    print(f"const [{i.replace(' ','_')}, set_{i.replace(' ','_')}] = useState('{i}');")
*/
function question(q: string, a1: string, a2: string, a3: string, a4: string, n: number): any {
  return { [`Q--`]: q, [`a-0`]: a1, [`a-1`]: a2, [`a-2`]: a3, [`a-3`]: a4, [`C--`]: n, };
}

function instantiateForm(questionNumber: number): any {
  const result: any[] = [{
    type: "string",
    name: `question`,
    label: `Quiz Question ${questionNumber} (the question)`,
    helpText: "what to question to ask the user",
    placeholder: 'what to google?',
    required: true,
  }], indexedPrototype = 'en passant, translate, lens,keep'.split(/, ?/g); let index = 0;
  for (const element of 'Top Left,Top Right,Bottom Left,Bottom Right'.split(',')) {
    result.push({
      type: "string",
      name: `answer-${++index}`,
      label: `Quiz Answer ${index} (${element} answer)`,
      helpText: "what to ask as the question",
      placeholder: `${indexedPrototype[index - 1]}`,
      required: true,
    });
  }
  result.push({
    type: "number",
    name: `answer-n`,
    label: `the answer number of the correct answer`,
    helpText: "the answer number of the correct answer",
    defaultValue: '2',
    required: true,
  });
  return result;
}

function typeOf(mixed: any): "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" | "NULL" {
  if (mixed === null) return 'NULL';
  return typeof mixed;
}

Devvit.addTrigger({
  event: 'PostDelete',
  onEvent: async function (event, context) {
    const postId = event.postId;
    await context.redis.del(`post-quiz-${postId}`);
  },
});

function deleteItemAtIndex(arr: any[], index: number) {
  index = Number(index);
  if (index >= 0 && index < arr.length) {
    return arr.splice(index, 1); // Remove 1 item at the specified index
  } else {
    console.log("Index out of bounds");
    return arr;
  }
}
function normalize_newlines(string: string) { return String(string).replace(/\r\n/g, '\n').replace(/\r/g, '\n'); }

function escape(string: string): string {
  return normalize_newlines(string).replace(/[~`>\-\\\[\]()#^&*_!<]/g, '\\$&');
}

// Add a custom post type to Devvit
Devvit.addCustomPostType({
  name: 'Quizpost',
  height: 'tall',
  render: (context) => {
    const [iterator_, setIterator_] = useState(0);
    const [questionNumberPlayer, set_questionNumberPlayer] = useState(0);
    const [disabled, set_disabled] = useState(true);
    //const [questionNumberCreator, set_questionNumberCreator] = useState(0);
    const [postType, set_postType] = useState('unloaded');

    const [Top_Left, set_Top_Left] = useState('Top Left');
    const [Top_Right, set_Top_Right] = useState('Top Right');
    const [Bottom_Left, set_Bottom_Left] = useState('Bottom Left');
    const [Bottom_Right, set_Bottom_Right] = useState('Bottom Right');
    const [current_correct_answer, set_current_correct_answer] = useState(0);
    const [questionText, set_questionText] = useState('Question1');
    const [max_questions, set_max_questions] = useState(1);
    const [questionsArray, set_questionsArray]: any[] = useState([
      // question("Which of the following do you need to build a green house?", "Bricks", "Paint", "Glass", "Vodka", 2),
      // question("Which is the largest?", "Earth", "Mars", "Milky Way", "Galaxy", 1),
      // question("What time is my dentist appointment?", "12:15", "4:53", "2:30", "Hammer", 3),
      // question("MTWTFS?", "M", "T", "F", "S", 4),
    ]), [questionsArrayPlayers, set_questionsArrayPlayers]: any[] = useState([]);
    const unrestricted_level = true, totalMaxQuestions = 20;
    // @ts-ignore
    useAsync(async function () {
      return await context.redis.get(`user-stats-${context.userId}`);
    }, {
      finally: function (data, error) {
        if (!error) {
          if (data) {
            const redisData = JSON.parse(String(data));
            if (redisData) {
              set_max_questions(redisData['userLevel'] ? redisData['userLevel'] : 1);
            } //else { }
          } //else { }
        } //else { }
      },
    });
    // @ts-ignore
    useAsync(async function () {
      return await context.redis.get(`post-quiz-${context.postId}`);
    }, {
      finally: function (data, error) {
        if (!error) {
          if (data) {
            const redisData = JSON.parse(String(data));
            if (redisData) {
              set_postType('Quized'); set_disabled(false);
              update(redisData.questionsArray[0]);
              set_current_correct_answer(redisData.questionsArray[0]['C--'] ?? 0);
              set_questionsArrayPlayers(redisData.questionsArray);
            } else {
              set_postType('Errored');
            }
          } else {
            set_postType('noData');
          }
        } else {
          set_postType('Errored');
        }
      },
    });
    function update(iterator__: number | any, array: any[] | null | undefined = undefined) {
      const answers = typeOf(iterator__) === 'number' ? Object((array ?? questionsArray)[iterator__] ?? null) : Object(iterator__);
      set_Top_Left(`${answers['a-0'] ?? 'Top Left'}`);
      set_Top_Right(`${answers['a-1'] ?? 'Top Right'}`);
      set_Bottom_Left(`${answers['a-2'] ?? 'Bottom Left'}`);
      set_Bottom_Right(`${answers['a-3'] ?? 'Bottom Right'}`);
      set_questionText(`${answers['Q--'] ?? 'Question1'}`);
    }
    const instantiatedForm = instantiateForm(questionsArray.length + 1);
    let form: any = useForm({
      title: 'Create a Quiz!', description: 'Create an quiz for users to complete',
      fields: instantiatedForm, acceptLabel: 'Create', cancelLabel: 'Cancel',
    }, async function (values) {

      if (!'1,2,3,4'.split(',').includes(String(values[`answer-n`]))) {
        context.ui.showToast("Sorry but the correct answer must be one of 1, 2, 3, 4");
        return;
      }
      const answers = {
        [`Q--`]: values[`question`], [`a-0`]: values[`answer-1`],
        [`a-1`]: values[`answer-2`], [`a-2`]: values[`answer-3`],
        [`a-3`]: values[`answer-4`], [`C--`]: values[`answer-n`],
      };/*return [...previous_questionsArray, {
        [`Q${questionIndex}--`]: values[`question${questionIndex}`],
        [`a${questionIndex}-0`]: values[`answer${questionIndex}-0`],
        [`a${questionIndex}-1`]: values[`answer${questionIndex}-1`],
        [`a${questionIndex}-2`]: values[`answer${questionIndex}-2`],
        [`a${questionIndex}-3`]: values[`answer${questionIndex}-3`],
        [`C${questionIndex}--`]: values[`answer-number`],
      }];set_questionsArray(function (previous_questionsArray: any)
      {return [...previous_questionsArray, answers];});*/
      set_questionsArray(function () { return [...questionsArray, answers]; });
      update(answers);
    }), turn_to_editor = postType === 'Editor' ? 'Create new Question' : 'Create my own Quiz';
    const asyncRunner = async function () {
      const currentUserName = await context.reddit.getCurrentUsername(), subredditName = await context.reddit.getCurrentSubredditName();
      if (currentUserName && subredditName) {
        if (postType !== 'Editor') {
          set_postType('Editor');
          set_disabled(true);
          update(iterator_);
          return;
        }
        if (questionsArray.length > totalMaxQuestions) {
          context.ui.showToast(`Sorry. a quiz can only have upto ${totalMaxQuestions} questions`);
          return;
        }
        if (questionsArray.length >= max_questions && !unrestricted_level) {
          context.ui.showToast("Sorry. you already have the max questions that your level allows");
          return;
        }
        context.ui.showForm(form);
      } else {
        context.ui.showToast("Sorry. only accounts with username can create quizes");
      }
      // if (postType !== 'Editor') {
      //   set_postType('Editor');
      //   set_disabled(true);
      //   update(iterator_);
      //   return;
      // }
      // //const currentUser = await context.reddit.getCurrentUser(), subreddit = await context.reddit.getCurrentSubreddit();
      // const currentUserName = await context.reddit.getCurrentUsername(), subredditName = await context.reddit.getCurrentSubredditName();
      // if (currentUserName && subredditName) {
      //   if (questionsArray.length >= totalMaxQuestions || (questionsArray.length >= max_questions && !unrestricted_level)) {
      //     context.ui.showToast("Sorry. you already have the max questions");
      //     return;
      //   }
      //   if (postType === 'Editor') { context.ui.showForm(form); }
      // } else { context.ui.showToast("Sorry. only accounts with username can post"); }
    };
    function set_iterator(sign: "+" | "-"): any {
      return function (): void {
        const newItem = iterator_ + Number(`${sign}1`);
        setIterator_(newItem !== newItem ? 0 : newItem);

        const answers = questionsArray[newItem];
        set_Top_Left(`${answers['a-0']}`);
        set_Top_Right(`${answers['a-1']}`);
        set_Bottom_Left(`${answers['a-2']}`);
        set_Bottom_Right(`${answers['a-3']}`);
        set_questionText(`${answers['Q--']}`);
      }
    }
    /*if (postType === 'Editor') {
      const answers = questionsArray[iterator_];
      set_Top_Left(`${answers['a-0']}`);
      set_Top_Right(`${answers['a-1']}`);
      set_Bottom_Left(`${answers['a-2']}`);
      set_Bottom_Right(`${answers['a-3']}`);
    set_questionText(`${answers['Q--']}`);}*/
    async function submitted(pos: "TL" | "TR" | "BL" | "BR") {
      let posN;
      switch (String(pos)) {
        case "TL":
          posN = 1;
          break;
        case "TR":
          posN = 2;
          break;
        case "BL":
          posN = 3;
          break;
        case "BR":
          posN = 4;
          break;
        default:
          throw new Error;
      }
      const correct = current_correct_answer === posN;
      context.ui.showToast((correct ? 'correct' : 'wrong') + '!');
      if (correct) {

        const newItem = questionNumberPlayer + 1;
        set_questionNumberPlayer(newItem);
        if (questionsArrayPlayers[newItem]) {
          update(newItem, questionsArrayPlayers);
          set_current_correct_answer(questionsArrayPlayers[newItem]['C--']);
        } else {
          set_current_correct_answer(5);
          set_Top_Left('Congatualtions');
          set_Top_Right('of this Quiz');
          set_Bottom_Left('all qustions');
          set_Bottom_Right('You solved');
          set_questionText('You Winner!');
          set_disabled(true);
        }
      }
    }
    const max = questionsArray.length - 1, questionNumber = postType === 'Editor' ? (iterator_ + 1) : questionNumberPlayer + 1;
    return (
      <vstack height="100%" width="100%" gap="medium" alignment="center middle">
        <text wrap={true}>Q {questionNumber}: {questionText}</text>
        <hstack gap="medium">
          <button appearance="primary" disabled={disabled} onPress={async function () { await submitted('TL'); }}>{Top_Left}</button>
          <button appearance="primary" disabled={disabled} onPress={async function () { await submitted('TR'); }}>{Top_Right}</button>
        </hstack>
        <hstack gap="medium">
          <button appearance="primary" disabled={disabled} onPress={async function () { await submitted('BL'); }}>{Bottom_Left}</button>
          <button appearance="primary" disabled={disabled} onPress={async function () { await submitted('BR'); }}>{Bottom_Right}</button>
        </hstack>

        <hstack gap="medium">
          {postType === 'Editor' ? <button appearance="destructive" onPress={async function () {
            if (!(questionsArray.length > 0)) {
              context.ui.showToast("Sorry. but there is nothing to delete");
              return;
            }

            const newItem = Math.max(iterator_ - 1, 0);
            setIterator_(newItem);
            //set_questionsArray([...deleteItemAtIndex(questionsArray, newItem)]);
            questionsArray.splice(iterator_, 1);
            const questions_array: any[] = [...questionsArray];
            set_questionsArray(questions_array);
            update(questions_array[newItem]);
            context.ui.showToast("Sucessfully deleted the question");
          }}>Delete question</button> : <button appearance="destructive" disabled={disabled} onPress={async function () {
            context.ui.showToast("You are a fool if you think i would just give you the answer");
          }}>i give up</button>}
          <button appearance="bordered" disabled={false} onPress={asyncRunner}>{turn_to_editor}</button>
        </hstack>
        <hstack gap="medium">
          {postType === 'Editor' ? <button appearance="primary" onPress={set_iterator('-')} disabled={!(iterator_ > 0)}>&lt;</button> : null}
          <text>Question {questionNumber}, (appV=&quot;{context.appVersion}&quot;)</text>
          {postType === 'Editor' ? <button appearance="primary" onPress={set_iterator('+')} disabled={!(iterator_ < max)}>&gt;</button> : null}
        </hstack>
        {postType === 'Editor' ? <text>you can have {max_questions} in a quiz total (you have {questionsArray.length} currently)</text> : null}
        {postType === 'Editor' ? <>
          <hstack gap="medium">
            <button appearance="success" onPress={async function () {
              if (!(questionsArray.length > 0)) {
                context.ui.showToast("Sorry. but what even are you asking the users? nothing?");
                return;
              }
              const currentUserName = await context.reddit.getCurrentUsername(),
                subredditName = await context.reddit.getCurrentSubredditName(),
                questionTitle = escape(questionsArray[0]['Q--']),
                postTitle = `u/${currentUserName}'s new Quiz "${questionTitle}" (${context.appVersion})`,
                escapeItem = function (item: string) { return `>!${escape(item)}!<`; };
              if (currentUserName && subredditName) {
                context.ui.showToast("Submitting Quiz");
                const post = await context.reddit.submitPost({
                  title: postTitle, subredditName: subredditName, preview: create_preview(context.appVersion),
                }), post_id = post.id, post_id_db = `post-quiz-${post.id}`;
                let commentString = '', questionIndex = 0;
                for (const element of questionsArray) {
                  let answers = '';
                  for (let answerIndex = 0; answerIndex < 4; answerIndex++) {
                    answers += `${answerIndex + 1}. ${escapeItem(element['a-' + answerIndex])}\n`;
                  }
                  commentString += `\n\n## Question ${++questionIndex}: ${escapeItem(element['Q--'])}\n\n${answers}`;
                }
                (await context.reddit.submitComment({
                  id: post_id, text: `${postTitle}\n\n- \`Quiz Creator:\` u/${currentUserName}\n- \`CreationTime: ${Date()}\`\n- \`AppVersion:`
                    + ` ${context.appVersion}\` ${commentString}\nto play this quiz please use the buttons on the what otherwise is an image`
                })).distinguish(true);
                await context.redis.set(post_id_db, JSON.stringify({ questionsArray }));
                await context.redis.expire(post_id_db, 30 * 24 * 60 * 60);
                context.ui.navigateTo(post);
              } else {
                context.ui.showToast("Sorry. only accounts with username can post");
              }
            }}>Create Quiz</button>
          </hstack>
        </> : null}
      </vstack>
    );
  },
});

export default Devvit;
