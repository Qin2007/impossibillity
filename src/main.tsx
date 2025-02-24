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
      <text>Question1</text>
      <hstack gap="medium">
        <button appearance="primary" disabled={disabled}>
          Top Left
        </button>
        <button appearance="primary" disabled={disabled}>
          Top Right
        </button>
      </hstack>
      <hstack gap="medium">
        <button appearance="primary" disabled={disabled}>
          Bottom Left
        </button>
        <button appearance="primary" disabled={disabled}>
          Bottom Right
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
// @ts-ignore
Devvit.addTrigger({
  event: 'PostDelete',
  handler: async function (event: any, context: any) {
    const postId = event.post.id;
    await context.redis.del(`post-quiz-${postId}`);
  },
});

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
    ]), unrestricted_level = false, [questionsArrayPlayers, set_questionsArrayPlayers]: any[] = useState([]);
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
      const answers = typeOf(iterator__) === 'number' ? ((array ?? questionsArray)[iterator__] ?? {}) : Object(iterator__);
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
      if (postType !== 'Editor') {
        set_postType('Editor');
        set_disabled(true);
        update(iterator_);
        return;
      }
      //const currentUser = await context.reddit.getCurrentUser(), subreddit = await context.reddit.getCurrentSubreddit();
      const currentUserName = await context.reddit.getCurrentUsername(), subredditName = await context.reddit.getCurrentSubredditName();
      if (currentUserName && subredditName) {
        if (questionsArray.length >= 10 || (questionsArray.length >= max_questions && !unrestricted_level)) {
          context.ui.showToast("Sorry. you already have the max questions");
          return;
        }
        if (postType === 'Editor') { context.ui.showForm(form); }
      } else {
        context.ui.showToast("Sorry. only accounts with username can post");
      }
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
      context.ui.showToast((correct ? 'correct' : 'wrong') + ', you chose ' + posN);
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
    const max = questionsArray.length - 1;
    return (
      <vstack height="100%" width="100%" gap="medium" alignment="center middle">
        <text>{questionText}</text>
        <hstack gap="medium">
          <button appearance="primary" disabled={disabled} onPress={async function () { await submitted('TL'); }}>{Top_Left}</button>
          <button appearance="primary" disabled={disabled} onPress={async function () { await submitted('TR'); }}>{Top_Right}</button>
        </hstack>
        <hstack gap="medium">
          <button appearance="primary" disabled={disabled} onPress={async function () { await submitted('BL'); }}>{Bottom_Left}</button>
          <button appearance="primary" disabled={disabled} onPress={async function () { await submitted('BR'); }}>{Bottom_Right}</button>
        </hstack>

        <hstack gap="medium">
          <button appearance="destructive" disabled={disabled} onPress={async function () {
            context.ui.showToast("You are a fool if you think i would just give you the answer");
          }}>i give up</button>
          <button appearance="bordered" disabled={false} onPress={asyncRunner}>{turn_to_editor}</button>
        </hstack>
        <hstack gap="medium">
          {postType === 'Editor' ? <button appearance="primary" onPress={set_iterator('-')} disabled={!(iterator_ > 0)}>&lt;</button> : null}
          <text>Question {postType === 'Editor' ? (iterator_ + 1) : questionNumberPlayer + 1}, (appV=&quot;{context.appVersion}&quot;)</text>
          {postType === 'Editor' ? <text>you can have {max_questions} in a quiz total</text> : null}
          {postType === 'Editor' ? <button appearance="primary" onPress={set_iterator('+')} disabled={!(iterator_ < max)}>&gt;</button> : null}
        </hstack>

        {postType === 'Editor' ? <button appearance="success" onPress={async function () {
          if (!(questionsArray.length > 0)) {
            context.ui.showToast("Sorry. but what even are you asking the users? nothing?");
            return;
          }
          const currentUserName = await context.reddit.getCurrentUsername(), subredditName = await context.reddit.getCurrentSubredditName();
          if (currentUserName && subredditName) {
            const post = await context.reddit.submitPost({
              title: `u/${currentUserName}'s new Quiz (${context.appVersion})`,
              subredditName: subredditName, preview: create_preview(context.appVersion),
            }), post_id = `post-quiz-${post.id}`;
            await context.redis.set(post_id, JSON.stringify({ questionsArray }));
            await context.redis.expire(post_id, 30 * 24 * 60 * 60);
            context.ui.navigateTo(post);
          } else {
            context.ui.showToast("Sorry. only accounts with username can post");
          }
        }}>Create</button> : null}
      </vstack>
    );
  },
});

export default Devvit;
