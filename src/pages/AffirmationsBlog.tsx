import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function AffirmationsBlog() {
  return (
    <>
      <Helmet>
        <title>Affirmations: The Scott Adams Method | Groovy Planning</title>
        <meta name="description" content="Learn about the power of affirmations from Dilbert creator Scott Adams. Write your goals 15 times a day and watch coincidences build until you achieve your objectives." />
        <meta property="og:title" content="Affirmations: A Simple Technique for Achieving Your Goals" />
        <meta property="og:description" content="Scott Adams shares his experience with affirmations and why writing your goals 15 times a day might just change your life." />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/blog">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </header>

        {/* Article */}
        <article className="container mx-auto px-4 py-12 max-w-3xl">
          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Originally published circa 2008
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              8 min read
            </span>
          </div>

          {/* Hero */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              Affirmations
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Write your goals 15 times a day and watch as coincidences build until you achieve your objectives against all odds.
            </p>
          </div>

          {/* Editor's Note */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
            <p className="text-sm text-muted-foreground italic mb-3">
              <strong>Editor's Note:</strong> This is a reprint of an essay by Scott Adams, creator of Dilbert, which is in the public domain.
            </p>
            <p className="text-foreground/90">
              "Affirmations have changed my life. I have been doing them on and off since 2015. In my opinion the single simplest thing that a person can do that will have the greatest effort-to-reward ratio is affirmations. I hope you'll give them a try."
            </p>
          </div>

          <Separator className="my-8" />

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 [&>p]:mb-0">
            <p className="text-foreground/90">
              Several years ago, in the closing pages of my otherwise humorous book titled <em>The Dilbert Future</em>, I told a weird little tale of how I used a technique called affirmations in my attempts to achieve a number of unlikely goals. Since then, I've received more questions on that topic than on anything else I've ever written. So I know this will pin the needle on the blog comments.
            </p>

            <p className="text-foreground/90">
              The idea behind affirmations is that you simply write down your goals 15 times a day and somehow, as if by magic, coincidences start to build until you achieve your objective against all odds.
            </p>

            <div className="bg-muted/50 rounded-lg p-6 my-6">
              <p className="text-lg font-semibold text-primary">
                An affirmation is a simple sentence such as "I, Scott Adams, will become a syndicated cartoonist."
              </p>
              <p className="text-foreground/90 mt-2">
                (That's one I actually used.)
              </p>
            </div>

            <p className="text-foreground/90">
              Prior to my Dilbert success, I used affirmations on a string of hugely unlikely goals that all materialized in ways that seemed miraculous. Some of the successes you can explain away by assuming I'm hugely talented and incredibly sexy, and therefore it is no surprise that I accomplished my goals despite seemingly long odds. I won't debate that interpretation because I like the way it sounds.
            </p>

            <p className="text-foreground/90">
              But some of my goals involved neither hard work nor skill of any kind. I succeeded with those too, against all odds. Those are harder to explain, at least for me, since the most common explanation is that they are a delusion. I found my experience with affirmations fascinating and puzzling, and so I wrote about it.
            </p>

            <Separator className="my-10" />

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              A Clarification
            </h2>

            <p className="text-foreground/90">
              At this point, allow me to correct a mistake I made the first time that I described my experience with affirmations. If you only hear the objective facts, it sounds as if I believe in some sort of voodoo or magic. That's not the case. While I do think there is something wonderful and inexplicable about affirmations, I have no reason to conclude it is any more than a pleasant hallucination. But if it is a hallucination, it's a totally cool one. When I have flying dreams, I know they aren't real, but it doesn't stop me from enjoying the hell out of them. And so it might be the same with affirmations. Affirmations might be nothing more than a wonderful illusion that you can control your own luck.
            </p>

            <p className="text-foreground/90">
              Skeptics have suggested – and reasonably so – that this is a classic case of selective memory. Perhaps I tried affirmations a bunch of times and only remember the times it seemed to work. That's exactly what I would assume if someone told me the stories I've told others. But working against this theory is the fact that affirmations leave a substantial paper trail. It would be hard to forget writing something 15 times a day for six months. And if it turns out that this is what happened to me, it's fascinating still, because it says a lot about how the mind works.
            </p>

            <Separator className="my-10" />

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              Possible Explanations
            </h2>

            <p className="text-foreground/90">
              My best guess about what really happens when you use affirmations is that several normal phenomena come together to create what seems abnormal. I'll describe a few theories of what might be behind affirmations. Maybe there are more.
            </p>

            <h3 className="text-xl font-bold text-foreground mt-10 mb-4">
              The Luck Factor
            </h3>

            <p className="text-foreground/90">
              There's a book called <em>The Luck Factor</em>, in which researcher Richard Wiseman describes studying people who considered themselves lucky, to see if they had any special powers along the lines of ESP. It turns out that they don't. But he did discover that people who expect luck have a more powerful ability to notice opportunities in their environment. Optimistic people's field of perception is literally greater. And the best part is he discovered that when you train people to expect luck, their field of perception increases accordingly.
            </p>

            <p className="text-foreground/90">
              I think part of the mystery of affirmations has to do with the fact that it improves your ability to notice an opportunity. And when you do, it seems like a lucky coincidence. In my case, about half of my seemingly miraculous results with affirmations could be traced back to my noticing something important.
            </p>

            <p className="text-foreground/90">
              I'm not sure if optimism is what inspires a person to go through the effort of writing affirmations, or if the affirmations cause the optimism. But in either case you would expect that people who are writing affirmations would more readily notice opportunities than the average non-optimist.
            </p>

            <h3 className="text-xl font-bold text-foreground mt-10 mb-4">
              Subconscious Communication
            </h3>

            <p className="text-foreground/90">
              I also wonder if affirmations are one way in which the subconscious (if such a thing exists) communicates with the rational part of your brain. Writing affirmations takes effort. Perhaps your subconscious only allows you to spend that much time on goals that it feels you have a chance of obtaining even if your rational mind does not. For example, my rational mind didn't believe I could become a syndicated cartoonist with no experience and virtually no artistic ability. But maybe some other part of my brain knew it was a realistic goal.
            </p>

            <p className="text-foreground/90">
              Viewed in this light, if you can write a goal 15 times a day for months, there's a good chance that some part of your brain views the goal as achievable even if your rational mind doesn't see how.
            </p>

            <h3 className="text-xl font-bold text-foreground mt-10 mb-4">
              Focus and Commitment
            </h3>

            <p className="text-foreground/90">
              Writing affirmations also helps you focus on your goal, moving them from wishful thinking to something in which you are willing to invest yourself. If you have ever managed people, you know that your staff's level of commitment makes a huge difference to their success. Perhaps affirmations are a way to manage your own level of commitment. In effect, you are brainwashing yourself, and this might help you get through the tough patches that come with pursuing ambitious goals.
            </p>

            <p className="text-foreground/90">
              When I started Dilbert, I didn't take a day off for ten years. You only work that hard if you fully expect something good to come from it. I did.
            </p>

            <h3 className="text-xl font-bold text-foreground mt-10 mb-4">
              The Inexplicable
            </h3>

            <p className="text-foreground/90">
              My favorite explanation for the power of affirmations also has the least evidence to support it, i.e. none. The idea behind this explanation is that human brains don't have the capacity to understand all the complexities of reality, and so our brains present us with highly simplified illusions that we treat as facts. In this model, affirmations are a lever on some entirely natural chain of cause and effect, but not a chain that our brains are capable of comprehending. While this view is unlikely to be correct, it has the advantage of being totally cool to think about.
            </p>

            <Separator className="my-10" />

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              What Others Have Experienced
            </h2>

            <p className="text-foreground/90">
              Since the publication of The Dilbert Future, I've received thousands of e-mails from people recounting their own experiences with affirmations. Most people seem to be amazed at how well they worked. I heard all kinds of stories of people changing careers, marrying the person of their dreams, making money, and starting businesses. I also heard stories from people who claimed affirmations didn't work for them, but the failure stories were the minority.
            </p>

            <p className="text-foreground/90">
              To be fair, the people who had success were more likely to get excited and write to me about it, so the most that I can conclude is that lots of people BELIEVE affirmations worked for them.
            </p>

            <Separator className="my-10" />

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              Frequently Asked Questions
            </h2>

            <p className="text-foreground/90">
              Since I know you are going to ask me a bundle of questions about affirmations, let me answer the ones I can anticipate:
            </p>

            <div className="bg-muted/50 rounded-lg p-6 my-6 space-y-4">
              <div>
                <h4 className="font-bold text-foreground">1. Technique doesn't matter much</h4>
                <p className="text-foreground/90 mt-1">
                  If affirmations work, it's probably because you are focusing on a goal. Therefore I doubt it matters exactly how you word the affirmation, or if it's handwritten or typed, or if you keep them or throw them away, or if you stop for a few days and then continue. I won't answer any other questions about technique because I'd be guessing.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground">2. No "monkey paw" effect</h4>
                <p className="text-foreground/90 mt-1">
                  I've never heard of a "monkey paw" effect where you achieve your goal but something horrible happens to you to balance it out.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground">3. I'm not currently doing affirmations</h4>
                <p className="text-foreground/90 mt-1">
                  I'm not doing any affirmations at the moment, mostly because I already have everything I want except a Nobel Prize. And even that wouldn't change my life much. But I do visualize all of my goals and I always expect good luck, so I probably get the benefits of affirmations – even if those are only psychological – without the effort.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground">4. Give it time</h4>
                <p className="text-foreground/90 mt-1">
                  I don't know how long you should try affirmations before concluding that they don't work for you. But trying it for less than six months probably doesn't give it a chance.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground">5. It doesn't always work</h4>
                <p className="text-foreground/90 mt-1">
                  Affirmations have not worked every time for me. But the few times they did not work, I must say I wasn't fully invested in the objective. For example, there are a few cases where if I had achieved an objective it would have caused a lifestyle change that wasn't entirely positive.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground">6. Further reading</h4>
                <p className="text-foreground/90 mt-1">
                  If you want to read more about affirmations, Google it. I don't have any particular book to recommend.
                </p>
              </div>
            </div>

            <Separator className="my-10" />

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6">
              Final Thoughts
            </h2>

            <p className="text-foreground/90">
              I know from my experience describing this topic that fully half of you reading it just concluded that "the Dilbert guy believes in magic." The truth is that I believe in cool things that haven't yet been explained to my satisfaction.
            </p>

            <p className="text-xl font-semibold text-foreground my-6">
              So here's a good test of your personality.
            </p>

            <p className="text-foreground/90">
              If all of your friends told you that they win money on the slot machines whenever they stick their fingers in their own ears, would you try it? Or would you assume that since there is no obvious reason it could work, it's not worth the effort?
            </p>

            <Separator className="my-10" />

            {/* CTA */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 my-8">
              <h3 className="text-xl font-bold text-foreground mb-3">Ready to try affirmations?</h3>
              <p className="text-foreground/90 mb-4">
                Practice writing your goals 15 times with our simple affirmations tool.
              </p>
              <Link to="/affirmations">
                <Button className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Start Practicing
                </Button>
              </Link>
            </div>
          </div>
        </article>

        {/* Footer */}
        <footer className="border-t border-border/40 bg-muted/30">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Essay by Scott Adams • Public Domain
              </p>
              <div className="flex gap-4">
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground">
                  More Articles
                </Link>
                <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}