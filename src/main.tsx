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
        <button appearance="bordered" disabled={true}>Create new</button>
      </hstack>
      <text>(appV=&quot;{appVersion}&quot;)</text>
    </vstack>
  );
}
/*for i in 'Top Left,Top Right,Bottom Left,Bottom Right'.split(','):
    print(f"const [{i.replace(' ','_')}, set_{i.replace(' ','_')}] = useState('{i}');")
*/
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

// Add a custom post type to Devvit
Devvit.addCustomPostType({
  name: 'Quizpost',
  height: 'tall',
  render: (context) => {
    const [iterator_, setIterator_] = useState(0);
    const [disabled, set_disabled] = useState(true);
    //const [questionNumber, set_questionNumber] = useState(0);
    const [questionNumberCreator, set_questionNumberCreator] = useState(0);
    const [postType, set_postType] = useState('unloaded');

    const [Top_Left, set_Top_Left] = useState('Top Left');
    const [Top_Right, set_Top_Right] = useState('Top Right');
    const [Bottom_Left, set_Bottom_Left] = useState('Bottom Left');
    const [Bottom_Right, set_Bottom_Right] = useState('Bottom Right');
    const [questionText, set_questionText] = useState('Question1');
    const [max_questions, set_max_questions] = useState(1);
    const [questionsArray, set_questionsArray]: any[] = useState([]);
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
            } else { }
          } else { }
        } else { }
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
              set_postType('Quized');
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
    let form: any, turn_to_editor = 'Create new Quiz';
    if (postType === 'Editor') {
      turn_to_editor = 'Create new Question';
      const questionIndex = questionsArray.length - 1, instantiatedForm = instantiateForm(questionsArray.length + 1);
      form = useForm({
        title: 'Create a Quiz!', description: 'Create an quiz for users to complete',
        fields: instantiatedForm, acceptLabel: 'Create', cancelLabel: 'Cancel',
      }, async function (values) {
        const answers = {
          [`Q--`]: values[`question`],
          [`a-0`]: values[`answer-1`],
          [`a-1`]: values[`answer-2`],
          [`a-2`]: values[`answer-3`],
          [`a-3`]: values[`answer-4`],
          [`C--`]: values[`answer-n`],
        };/*return [...previous_questionsArray, {
          [`Q${questionIndex}--`]: values[`question${questionIndex}`],
          [`a${questionIndex}-0`]: values[`answer${questionIndex}-0`],
          [`a${questionIndex}-1`]: values[`answer${questionIndex}-1`],
          [`a${questionIndex}-2`]: values[`answer${questionIndex}-2`],
          [`a${questionIndex}-3`]: values[`answer${questionIndex}-3`],
          [`C${questionIndex}--`]: values[`answer-number`],
        }];*/
        set_questionsArray(function (previous_questionsArray: any) {
          return [...previous_questionsArray, answers];
        });
        /*const post = await context.reddit.submitPost({
          title: `u/${currentUserName}'s new Quiz (${context.appVersion})`,
          subredditName: subredditName, preview: create_preview(context.appVersion),
        });
        context.redis.set(`user-iterator-${post.id}`, JSON.stringify({}));
        context.ui.navigateTo(post);*/
        set_Top_Left(`${answers['a-0']}`);
        set_Top_Right(`${answers['a-1']}`);
        set_Bottom_Left(`${answers['a-2']}`);
        set_Bottom_Right(`${answers['a-3']}`);
        set_questionText(`${answers['Q--']}`);
      });
    }
    const asyncRunner = async function () {
      if (form === undefined) {
        set_postType('Editor');
        set_questionsArray(function () {
          return [];
        });
        return;
      }
      //const currentUser = await context.reddit.getCurrentUser(), subreddit = await context.reddit.getCurrentSubreddit();
      const currentUserName = await context.reddit.getCurrentUsername(), subredditName = await context.reddit.getCurrentSubredditName();
      if (currentUserName && subredditName) {
        if (questionsArray.length >= 10 || questionsArray.length >= max_questions) {
          context.ui.showToast("Sorry. you already have the max questions");
          return;
        }
        const ptype = postType;
        if (ptype === 'Editor') {
          context.ui.showForm(form);
        }
      } else {
        context.ui.showToast("Sorry. only accounts with username can post");
      }
    };
    function set_iterator(sign: "+" | "-"): any {
      return function (): void {
        const newItem = iterator_ + Number(`${sign}1`);
        setIterator_(newItem !== newItem ? 0 : newItem);
      }
    }
    return (
      <vstack height="100%" width="100%" gap="medium" alignment="center middle">
        <text>{questionText}</text>
        <hstack gap="medium">
          <button appearance="primary" disabled={disabled}>{Top_Left}</button>
          <button appearance="primary" disabled={disabled}>{Top_Right}</button>
        </hstack>
        <hstack gap="medium">
          <button appearance="primary" disabled={disabled}>{Bottom_Left}</button>
          <button appearance="primary" disabled={disabled}>{Bottom_Right}</button>
        </hstack>

        <hstack gap="medium">
          <button appearance="destructive" disabled={disabled}>i give up</button>
          <button appearance="bordered" disabled={false} onPress={asyncRunner}>{turn_to_editor}</button>
        </hstack>
        <hstack gap="medium">
          {postType === 'Editor' ? <button appearance="primary" onPress={set_iterator('-')} disabled={!(iterator_ > 0)}>&lt;</button> : <></>}
          <text>{iterator_ + 1}, (max_questions={max_questions}, appV=&quot;{context.appVersion}&quot;)</text>
          {postType === 'Editor' ? <button appearance="primary" onPress={set_iterator('+')} disabled={!(iterator_ < questionsArray.length - 1)}>&gt;</button> : null}
        </hstack>
      </vstack>
    );
  },
});

export default Devvit;
