import { makeQuestion } from 'test/factories/make-question'
import { InMemoryQuestionCommentsRepository } from 'test/repositories/in-memory/in-memory-question-comments-repository'
import { InMemoryQuestionsRepository } from 'test/repositories/in-memory/in-memory-questions-repository'
import { CommentOnQuestionUseCase } from './comment-on-question'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Either } from '@/core/either'
import { QuestionComment } from '../../enterprise/entities/question-comment'
import { InMemoryQuestionAttachmentsRepository } from 'test/repositories/in-memory/in-memory-question-attachments-repository'

let questionCommentsRepository: InMemoryQuestionCommentsRepository
let questionsRepository: InMemoryQuestionsRepository
let questionAttachmentsRepository: InMemoryQuestionAttachmentsRepository
let sut: CommentOnQuestionUseCase // system under test

describe('Comment On Question Use Case', () => {
  beforeEach(() => {
    questionCommentsRepository = new InMemoryQuestionCommentsRepository()
    questionAttachmentsRepository = new InMemoryQuestionAttachmentsRepository()
    questionsRepository = new InMemoryQuestionsRepository(
      questionAttachmentsRepository,
    )
    sut = new CommentOnQuestionUseCase(
      questionsRepository,
      questionCommentsRepository,
    )
  })

  it('should be able to comment on question successfully', async () => {
    const question = makeQuestion()
    await questionsRepository.create(question)

    const result = (await sut.execute({
      authorId: 'author-01',
      questionId: question.id.toString(),
      content: 'Question Comment Content',
    })) as Either<null, { questionComment: QuestionComment }>

    expect(questionCommentsRepository.questionComments[0].content).toEqual(
      result.value?.questionComment.content,
    )
  })

  it('should not be able to comment on question when it not exists', async () => {
    const result = await sut.execute({
      authorId: 'author-01',
      questionId: 'question-01',
      content: 'Question Comment Content',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
