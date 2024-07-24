import { makeQuestion } from 'test/factories/make-question'
import { InMemoryQuestionsRepository } from 'test/repositories/in-memory/in-memory-questions-repository'
import { GetQuestionBySlugUseCase } from './get-question-by-slug'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Slug } from '../../enterprise/entities/value-objects/slug'
import { Either } from '@/core/either'
import { Question } from '../../enterprise/entities/question'
import { InMemoryQuestionAttachmentsRepository } from 'test/repositories/in-memory/in-memory-question-attachments-repository'

let questionsRepository: InMemoryQuestionsRepository
let questionAttachmentsRepository: InMemoryQuestionAttachmentsRepository
let sut: GetQuestionBySlugUseCase // system under test

describe('Get Question By Slug Use Case', () => {
  beforeEach(() => {
    questionAttachmentsRepository = new InMemoryQuestionAttachmentsRepository()
    questionsRepository = new InMemoryQuestionsRepository(
      questionAttachmentsRepository,
    )
    sut = new GetQuestionBySlugUseCase(questionsRepository)
  })

  it('should be able to get a question by slug successfully', async () => {
    const newQuestion = makeQuestion({
      slug: Slug.create('question-title'),
    })

    await questionsRepository.create(newQuestion)

    const result = (await sut.execute({
      slug: 'question-title',
    })) as Either<null, { question: Question }>

    expect(result.value?.question.id).toBeTruthy()
    expect(result.value?.question.title).toEqual(newQuestion.title)
  })

  it('should not be able to get a question by slug when it is invalid', async () => {
    const result = await sut.execute({
      slug: 'invalid-or-inexistent-slug',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
